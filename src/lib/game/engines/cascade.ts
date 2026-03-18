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
  CascadeStep,
} from "@/types";
import { secureRandomInt } from "../rng";
import type { SymbolWeight } from "./shared";
import { DENOMINATIONS } from "./shared";

const CASCADE_SYMBOLS: GameSymbol[] = [
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
  seven: { 5: 5, 4: 2, 3: 0.5 },
  bar: { 5: 3, 4: 1, 3: 0.3 },
  watermelon: { 5: 2, 4: 0.8, 3: 0.2 },
  grape: { 5: 1.5, 4: 0.6, 3: 0.15 },
  orange: { 5: 1.2, 4: 0.5, 3: 0.1 },
  lemon: { 5: 1, 4: 0.4, 3: 0.08 },
  cherry: { 5: 0.8, 4: 0.3, 3: 0.05 },
  wild: { 5: 10, 4: 3, 3: 1 },
};

const SCATTER_PAYOUTS: Record<number, number> = { 3: 2, 4: 10, 5: 50 };

const CASCADE_MULTIPLIERS = [1, 1, 2, 2, 3, 3, 5, 5];
const MAX_CASCADES = 8;
const REELS = 5;
const ROWS = 5;

const PAYLINES: [number, number][][] = [
  [[0,2],[1,2],[2,2],[3,2],[4,2]],
  [[0,1],[1,1],[2,1],[3,1],[4,1]],
  [[0,3],[1,3],[2,3],[3,3],[4,3]],
  [[0,0],[1,0],[2,0],[3,0],[4,0]],
  [[0,4],[1,4],[2,4],[3,4],[4,4]],
  [[0,0],[1,1],[2,2],[3,3],[4,4]],
  [[0,4],[1,3],[2,2],[3,1],[4,0]],
  [[0,1],[1,0],[2,1],[3,2],[4,1]],
  [[0,3],[1,4],[2,3],[3,2],[4,3]],
  [[0,0],[1,1],[2,1],[3,1],[4,0]],
  [[0,4],[1,3],[2,3],[3,3],[4,4]],
  [[0,1],[1,2],[2,3],[3,2],[4,1]],
  [[0,3],[1,2],[2,1],[3,2],[4,3]],
  [[0,0],[1,0],[2,1],[3,0],[4,0]],
  [[0,4],[1,4],[2,3],[3,4],[4,4]],
  [[0,2],[1,1],[2,0],[3,1],[4,2]],
  [[0,2],[1,3],[2,4],[3,3],[4,2]],
  [[0,1],[1,1],[2,2],[3,1],[4,1]],
  [[0,3],[1,3],[2,2],[3,3],[4,3]],
  [[0,2],[1,2],[2,1],[3,2],[4,2]],
];

function pickWeightedSymbol(): GameSymbol {
  let roll = secureRandomInt(TOTAL_WEIGHT);
  for (const { symbol, weight } of SYMBOL_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return symbol;
  }
  return "cherry";
}

function generateGrid(): SymbolGrid {
  const grid: SymbolGrid = [];
  for (let col = 0; col < REELS; col++) {
    const reel: GameSymbol[] = [];
    for (let row = 0; row < ROWS; row++) {
      reel.push(pickWeightedSymbol());
    }
    grid.push(reel);
  }
  return grid;
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
  cascadeMultiplier: number
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
  if (!baseSymbol) baseSymbol = "wild";

  let matchCount = 0;
  for (const symbol of symbols) {
    if (symbol === baseSymbol || symbol === "wild") {
      matchCount++;
    } else {
      break;
    }
  }

  const payoutMultiplier = PAYOUT_TABLE[baseSymbol]?.[matchCount] ?? 0;
  const winAmount = payoutMultiplier * betPerLine * cascadeMultiplier;

  return {
    paylineIndex,
    symbols,
    positions,
    winAmount,
    multiplier: cascadeMultiplier,
  };
}

function evaluateGridWins(
  grid: SymbolGrid,
  betPerLine: number,
  cascadeMultiplier: number
): WinEvaluation {
  const lines: WinLine[] = [];
  let hasWild = false;

  for (let i = 0; i < PAYLINES.length; i++) {
    const line = evaluatePayline(grid, PAYLINES[i], i, betPerLine, cascadeMultiplier);
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
    ? (SCATTER_PAYOUTS[scatterCount] ?? 0) * betPerLine * cascadeMultiplier
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

function findWinningPositions(wins: WinEvaluation): Set<string> {
  const positions = new Set<string>();
  for (const line of wins.lines) {
    const baseSymbol = line.symbols.find((s) => s !== "wild" && s !== "scatter") ?? line.symbols[0];
    for (let i = 0; i < line.symbols.length; i++) {
      if (line.symbols[i] === baseSymbol || line.symbols[i] === "wild") {
        const [col, row] = line.positions[i];
        positions.add(`${col},${row}`);
      } else {
        break;
      }
    }
  }
  return positions;
}

function cascadeGrid(grid: SymbolGrid, removedPositions: Set<string>): SymbolGrid {
  const newGrid: SymbolGrid = [];

  for (let col = 0; col < grid.length; col++) {
    const remaining: GameSymbol[] = [];
    for (let row = 0; row < grid[col].length; row++) {
      if (!removedPositions.has(`${col},${row}`)) {
        remaining.push(grid[col][row]);
      }
    }
    const needed = grid[col].length - remaining.length;
    const newSymbols: GameSymbol[] = [];
    for (let i = 0; i < needed; i++) {
      newSymbols.push(pickWeightedSymbol());
    }
    newGrid.push([...newSymbols, ...remaining]);
  }

  return newGrid;
}

export class CascadeEngine implements IGameEngine {
  readonly config: GameConfig = {
    id: "cascade",
    name: "Cascade Crush",
    reels: REELS,
    rows: ROWS,
    paylines: 20,
    symbols: CASCADE_SYMBOLS,
    minBet: 0.10,
    maxBet: 500,
    denominations: DENOMINATIONS,
    bonusFreeSpins: 12,
    bonusMultiplier: 3,
    rtp: 0.962,
  };

  spin(bet: SpinRequest): SpinResult {
    let grid = generateGrid();
    const cascades: CascadeStep[] = [];
    let totalWin = 0;
    let cascadeIndex = 0;
    const bonusMultiplier = bet.bonus.isActive ? bet.bonus.multiplier : 1;

    while (cascadeIndex < MAX_CASCADES) {
      const cascadeMultiplier = CASCADE_MULTIPLIERS[cascadeIndex] * bonusMultiplier;
      const wins = evaluateGridWins(grid, bet.betPerLine, cascadeMultiplier);

      if (wins.totalWin === 0) break;

      const winPositions = findWinningPositions(wins);
      const removedArray: [number, number][] = [];
      for (const pos of winPositions) {
        const [col, row] = pos.split(",").map(Number);
        removedArray.push([col, row]);
      }

      cascades.push({
        grid: grid.map((r) => [...r]),
        wins,
        removedPositions: removedArray,
        multiplier: CASCADE_MULTIPLIERS[cascadeIndex],
      });

      totalWin += wins.totalWin;
      grid = cascadeGrid(grid, winPositions);
      cascadeIndex++;
    }

    const finalWins = this.evaluateWins(grid, bet.betPerLine);
    const scatterCount = this._countScattersInAllSteps(cascades, grid);
    const bonusResult = this.triggerBonus(grid, bet.bonus);

    const paylines: PaylineResult[] = (cascades[0]?.wins.lines ?? []).map((line) => ({
      paylineIndex: line.paylineIndex,
      symbols: line.symbols,
      winAmount: line.winAmount,
      isWin: line.winAmount > 0,
    }));

    return {
      reels: grid,
      paylines,
      totalWin,
      bonusTriggered: bonusResult.triggered || scatterCount >= 3,
      scatterCount,
      gameType: "cascade",
      wins: finalWins,
      cascades,
    };
  }

  evaluateWins(grid: SymbolGrid, betPerLine: number): WinEvaluation {
    return evaluateGridWins(grid, betPerLine, 1);
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

  private _countScattersInAllSteps(cascades: CascadeStep[], finalGrid: SymbolGrid): number {
    let max = countScatters(finalGrid);
    for (const step of cascades) {
      const sc = countScatters(step.grid);
      if (sc > max) max = sc;
    }
    return max;
  }
}
