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

const CLASSIC_SYMBOLS: GameSymbol[] = [
  "cherry", "lemon", "orange", "grape", "watermelon", "bar", "seven",
];

const SYMBOL_WEIGHTS: SymbolWeight[] = [
  { symbol: "cherry", weight: 7 },
  { symbol: "lemon", weight: 6 },
  { symbol: "orange", weight: 5 },
  { symbol: "grape", weight: 5 },
  { symbol: "watermelon", weight: 4 },
  { symbol: "bar", weight: 3 },
  { symbol: "seven", weight: 2 },
];

const TOTAL_WEIGHT = SYMBOL_WEIGHTS.reduce((s, w) => s + w.weight, 0);

const PAYOUT_TABLE: Record<GameSymbol, Record<number, number>> = {
  seven: { 3: 100 },
  bar: { 3: 50 },
  watermelon: { 3: 20 },
  grape: { 3: 15, 2: 5 },
  orange: { 3: 10, 2: 3 },
  lemon: { 3: 8, 2: 2 },
  cherry: { 3: 5, 2: 1 },
  wild: {},
  scatter: {},
};

const PAYLINES: [number, number][][] = [
  [[0, 0], [1, 0], [2, 0]],
  [[0, 1], [1, 1], [2, 1]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

function buildReelStrip(): GameSymbol[] {
  const strip: GameSymbol[] = [];
  for (const { symbol, weight } of SYMBOL_WEIGHTS) {
    const stopsForSymbol = Math.round((weight / TOTAL_WEIGHT) * 32);
    for (let i = 0; i < stopsForSymbol; i++) {
      strip.push(symbol);
    }
  }
  while (strip.length < 32) {
    strip.push("cherry");
  }
  return strip;
}

const REEL_STRIPS = [buildReelStrip(), buildReelStrip(), buildReelStrip()];

function pickSymbol(reelIndex: number): GameSymbol {
  const strip = REEL_STRIPS[reelIndex];
  return strip[secureRandomInt(strip.length)];
}

function generateGrid(): SymbolGrid {
  const grid: SymbolGrid = [];
  for (let col = 0; col < 3; col++) {
    const reel: GameSymbol[] = [];
    for (let row = 0; row < 3; row++) {
      reel.push(pickSymbol(col));
    }
    grid.push(reel);
  }
  return grid;
}

function evaluatePayline(
  grid: SymbolGrid,
  payline: [number, number][],
  paylineIndex: number,
  betPerLine: number,
  multiplier: number
): WinLine {
  const symbols = payline.map(([col, row]) => grid[col][row]);
  const positions = payline;
  const baseSymbol = symbols[0];

  let matchCount = 0;
  for (const symbol of symbols) {
    if (symbol === baseSymbol) {
      matchCount++;
    } else {
      break;
    }
  }

  const payoutMultiplier = PAYOUT_TABLE[baseSymbol]?.[matchCount] ?? 0;
  const winAmount = payoutMultiplier * betPerLine * multiplier;

  return {
    paylineIndex,
    symbols,
    positions,
    winAmount,
    multiplier,
  };
}

export class ClassicEngine implements IGameEngine {
  readonly config: GameConfig = {
    id: "classic",
    name: "Classic Fruits",
    reels: 3,
    rows: 3,
    paylines: 5,
    symbols: CLASSIC_SYMBOLS,
    minBet: 0.10,
    maxBet: 500,
    denominations: DENOMINATIONS,
    bonusFreeSpins: 10,
    bonusMultiplier: 2,
    rtp: 0.96,
  };

  spin(bet: SpinRequest): SpinResult {
    const grid = generateGrid();
    const wins = this.evaluateWins(grid, bet.betPerLine);
    const bonusResult = this.triggerBonus(grid, bet.bonus);
    const totalWin = this.calculatePayout(wins, bet.betPerLine);

    const paylines: PaylineResult[] = wins.lines.map((line) => ({
      paylineIndex: line.paylineIndex,
      symbols: line.symbols,
      winAmount: line.winAmount,
      isWin: line.winAmount > 0,
    }));

    return {
      reels: grid,
      paylines,
      totalWin,
      bonusTriggered: bonusResult.triggered,
      scatterCount: wins.scatterCount,
      gameType: "classic",
      wins,
    };
  }

  evaluateWins(grid: SymbolGrid, betPerLine: number): WinEvaluation {
    const multiplier = 1;
    const lines: WinLine[] = [];
    let hasWild = false;

    for (let i = 0; i < PAYLINES.length; i++) {
      const line = evaluatePayline(grid, PAYLINES[i], i, betPerLine, multiplier);
      if (line.winAmount > 0) {
        lines.push(line);
      }
    }

    for (const reel of grid) {
      for (const s of reel) {
        if (s === "wild") hasWild = true;
      }
    }

    const totalWin = lines.reduce((sum, l) => sum + l.winAmount, 0);

    return {
      lines,
      scatterWin: 0,
      totalWin,
      hasWild,
      scatterCount: 0,
    };
  }

  triggerBonus(_grid: SymbolGrid, state: BonusState): BonusResult {
    return { triggered: false, newState: state };
  }

  calculatePayout(wins: WinEvaluation, _bet: number): number {
    return Math.max(0, wins.totalWin);
  }
}
