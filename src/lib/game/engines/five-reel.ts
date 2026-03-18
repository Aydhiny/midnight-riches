import type {
  GameSymbol,
  SymbolGrid,
  SpinResult,
  SpinRequest,
  WinEvaluation,
  WinLine,
  BonusState,
  BonusResult,
  GameConfig,
  IGameEngine,
  PaylineResult,
} from "@/types";
import { secureRandomInt } from "../rng";
import type { SymbolWeight } from "./shared";
import { DENOMINATIONS } from "./shared";

const FIVE_REEL_SYMBOLS: GameSymbol[] = [
  "cherry", "lemon", "orange", "grape", "watermelon", "bar", "seven", "wild", "scatter",
];

const SYMBOL_WEIGHTS: SymbolWeight[] = [
  { symbol: "cherry", weight: 8 },
  { symbol: "lemon", weight: 7 },
  { symbol: "orange", weight: 6 },
  { symbol: "grape", weight: 6 },
  { symbol: "watermelon", weight: 5 },
  { symbol: "bar", weight: 4 },
  { symbol: "seven", weight: 3 },
  { symbol: "wild", weight: 2 },
  { symbol: "scatter", weight: 2 },
];

const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce((s, w) => s + w.weight, 0);

const PAYOUT_TABLE: Partial<Record<GameSymbol, Record<number, number>>> = {
  seven: { 5: 500, 4: 100, 3: 50 },
  bar: { 5: 200, 4: 50, 3: 25 },
  watermelon: { 5: 100, 4: 30, 3: 15 },
  grape: { 5: 75, 4: 20, 3: 10 },
  orange: { 5: 50, 4: 15, 3: 8 },
  lemon: { 5: 40, 4: 10, 3: 5 },
  cherry: { 5: 25, 4: 8, 3: 3 },
  wild: { 5: 1000, 4: 200, 3: 100 },
};

const SCATTER_PAYOUTS: Record<number, number> = { 3: 5, 4: 20, 5: 100 };

const PAYLINES: [number, number][][] = [
  [[0,1],[1,1],[2,1],[3,1],[4,1]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,2],[1,2],[2,2],[3,2],[4,2]],
  [[0,0],[1,1],[2,2],[3,1],[4,0]],
  [[0,2],[1,1],[2,0],[3,1],[4,2]],
  [[0,0],[1,0],[2,1],[3,2],[4,2]],
  [[0,2],[1,2],[2,1],[3,0],[4,0]],
  [[0,1],[1,0],[2,0],[3,0],[4,1]],
  [[0,1],[1,2],[2,2],[3,2],[4,1]],
  [[0,0],[1,1],[2,1],[3,1],[4,0]],
  [[0,2],[1,1],[2,1],[3,1],[4,2]],
  [[0,1],[1,0],[2,1],[3,2],[4,1]],
  [[0,1],[1,2],[2,1],[3,0],[4,1]],
  [[0,0],[1,0],[2,2],[3,0],[4,0]],
  [[0,2],[1,2],[2,0],[3,2],[4,2]],
  [[0,0],[1,1],[2,0],[3,1],[4,0]],
  [[0,2],[1,1],[2,2],[3,1],[4,2]],
  [[0,0],[1,2],[2,0],[3,2],[4,0]],
  [[0,2],[1,0],[2,2],[3,0],[4,2]],
  [[0,1],[1,1],[2,0],[3,1],[4,1]],
];

function buildReelStrip(stops: number): GameSymbol[] {
  const strip: GameSymbol[] = [];
  for (let i = 0; i < stops; i++) {
    let roll = secureRandomInt(TOTAL_WEIGHT);
    for (const { symbol, weight } of SYMBOL_WEIGHTS) {
      roll -= weight;
      if (roll < 0) {
        strip.push(symbol);
        break;
      }
    }
  }
  return strip;
}

const REEL_STRIPS = Array.from({ length: 5 }, () => buildReelStrip(48));

function generateGrid(): SymbolGrid {
  const grid: SymbolGrid = [];
  for (let col = 0; col < 5; col++) {
    const reel: GameSymbol[] = [];
    const strip = REEL_STRIPS[col];
    for (let row = 0; row < 3; row++) {
      reel.push(strip[secureRandomInt(strip.length)]);
    }
    grid.push(reel);
  }
  return grid;
}

function expandWildsOnReel3(grid: SymbolGrid): { grid: SymbolGrid; expanded: boolean } {
  const hasWildOnReel3 = grid[2].some((s) => s === "wild");
  if (!hasWildOnReel3) return { grid, expanded: false };

  const newGrid = grid.map((reel, i) => {
    if (i === 2) return reel.map(() => "wild" as GameSymbol);
    return [...reel];
  });
  return { grid: newGrid, expanded: true };
}

function countScatters(grid: SymbolGrid): number {
  let count = 0;
  for (const reel of grid) {
    for (const s of reel) {
      if (s === "scatter") count++;
    }
  }
  return count;
}

function evaluatePayline(
  grid: SymbolGrid,
  payline: [number, number][],
  paylineIndex: number,
  betPerLine: number,
  bonusMultiplier: number
): WinLine {
  const symbols = payline.map(([col, row]) => grid[col][row]);
  const positions = payline;

  let baseSymbol: GameSymbol | null = null;
  for (const s of symbols) {
    if (s !== "wild" && s !== "scatter") {
      baseSymbol = s;
      break;
    }
  }

  if (!baseSymbol) {
    baseSymbol = "wild";
  }

  let matchCount = 0;
  let wildCount = 0;
  for (const symbol of symbols) {
    if (symbol === baseSymbol || symbol === "wild") {
      matchCount++;
      if (symbol === "wild") wildCount++;
    } else {
      break;
    }
  }

  const payoutMultiplier = PAYOUT_TABLE[baseSymbol]?.[matchCount] ?? 0;
  const wildMultiplier = wildCount > 0 ? 2 : 1;
  const winAmount = payoutMultiplier * betPerLine * wildMultiplier * bonusMultiplier;

  return {
    paylineIndex,
    symbols,
    positions,
    winAmount,
    multiplier: wildMultiplier * bonusMultiplier,
  };
}

export class FiveReelEngine implements IGameEngine {
  readonly config: GameConfig = {
    id: "five-reel",
    name: "Five Reel Deluxe",
    reels: 5,
    rows: 3,
    paylines: 20,
    symbols: FIVE_REEL_SYMBOLS,
    minBet: 0.10,
    maxBet: 500,
    denominations: DENOMINATIONS,
    bonusFreeSpins: 15,
    bonusMultiplier: 3,
    rtp: 0.965,
  };

  spin(bet: SpinRequest): SpinResult {
    let grid = generateGrid();
    const { grid: expandedGrid, expanded } = expandWildsOnReel3(grid);
    grid = expandedGrid;

    const bonusMultiplier = bet.bonus.isActive ? bet.bonus.multiplier : 1;
    const wins = this.evaluateWins(grid, bet.betPerLine);
    const totalWin = wins.totalWin * bonusMultiplier;
    const bonusResult = this.triggerBonus(grid, bet.bonus);

    const adjustedWins: WinEvaluation = {
      ...wins,
      totalWin,
    };

    const paylines: PaylineResult[] = wins.lines.map((line) => ({
      paylineIndex: line.paylineIndex,
      symbols: line.symbols,
      winAmount: line.winAmount * bonusMultiplier,
      isWin: line.winAmount > 0,
    }));

    return {
      reels: grid,
      paylines,
      totalWin,
      bonusTriggered: bonusResult.triggered,
      scatterCount: wins.scatterCount,
      gameType: "five-reel",
      wins: adjustedWins,
      expandedWilds: expanded ? [2] : [],
    };
  }

  evaluateWins(grid: SymbolGrid, betPerLine: number): WinEvaluation {
    const lines: WinLine[] = [];
    let hasWild = false;

    for (let i = 0; i < PAYLINES.length; i++) {
      const line = evaluatePayline(grid, PAYLINES[i], i, betPerLine, 1);
      if (line.winAmount > 0) {
        lines.push(line);
      }
    }

    for (const reel of grid) {
      for (const s of reel) {
        if (s === "wild") hasWild = true;
      }
    }

    const scatterCount = countScatters(grid);
    const scatterWin = scatterCount >= 3
      ? (SCATTER_PAYOUTS[scatterCount] ?? 0) * betPerLine * PAYLINES.length
      : 0;

    const lineWin = lines.reduce((sum, l) => sum + l.winAmount, 0);

    return {
      lines,
      scatterWin,
      totalWin: lineWin + scatterWin,
      hasWild,
      scatterCount,
    };
  }

  triggerBonus(grid: SymbolGrid, state: BonusState): BonusResult {
    const scatterCount = countScatters(grid);
    if (scatterCount >= 3 && !state.isActive) {
      return {
        triggered: true,
        newState: {
          isActive: true,
          spinsRemaining: this.config.bonusFreeSpins,
          multiplier: this.config.bonusMultiplier,
          totalBonusWin: 0,
        },
      };
    }
    if (state.isActive) {
      const remaining = state.spinsRemaining - 1;
      return {
        triggered: false,
        newState: {
          isActive: remaining > 0,
          spinsRemaining: remaining,
          multiplier: remaining > 0 ? state.multiplier : 1,
          totalBonusWin: state.totalBonusWin,
        },
      };
    }
    return { triggered: false, newState: state };
  }

  calculatePayout(wins: WinEvaluation, _bet: number): number {
    return Math.max(0, wins.totalWin);
  }
}
