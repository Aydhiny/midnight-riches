import type {
  GameSymbol,
  SymbolGrid,
  SpinResult,
  SpinRequest,
  WinEvaluation,
  BonusState,
  BonusResult,
  GameConfig,
  IGameEngine,
  PaylineResult,
} from "@/types";
import { secureRandomInt } from "../rng";
import type { SymbolWeight } from "./shared";
import { DENOMINATIONS } from "./shared";

const MEGAWAYS_SYMBOLS: GameSymbol[] = [
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
  seven: { 6: 50, 5: 25, 4: 10, 3: 3 },
  bar: { 6: 25, 5: 12, 4: 5, 3: 2 },
  watermelon: { 6: 15, 5: 8, 4: 3, 3: 1.5 },
  grape: { 6: 12, 5: 6, 4: 2.5, 3: 1 },
  orange: { 6: 10, 5: 5, 4: 2, 3: 0.8 },
  lemon: { 6: 8, 5: 4, 4: 1.5, 3: 0.6 },
  cherry: { 6: 6, 5: 3, 4: 1, 3: 0.4 },
  wild: { 6: 100, 5: 50, 4: 20, 3: 5 },
};

const SCATTER_PAYOUTS: Record<number, number> = { 4: 5, 5: 20, 6: 100 };

const MAIN_REELS = 6;
const MIN_HEIGHT = 2;
const MAX_HEIGHT = 7;
const TOP_REEL_SIZE = 4;

function pickWeightedSymbol(): GameSymbol {
  let roll = secureRandomInt(TOTAL_WEIGHT);
  for (const { symbol, weight } of SYMBOL_WEIGHTS) {
    roll -= weight;
    if (roll < 0) return symbol;
  }
  return "cherry";
}

function generateReelHeights(): number[] {
  const heights: number[] = [];
  for (let i = 0; i < MAIN_REELS; i++) {
    heights.push(MIN_HEIGHT + secureRandomInt(MAX_HEIGHT - MIN_HEIGHT + 1));
  }
  return heights;
}

function generateMegawaysGrid(reelHeights: number[]): SymbolGrid {
  const grid: SymbolGrid = [];
  for (let col = 0; col < MAIN_REELS; col++) {
    const reel: GameSymbol[] = [];
    for (let row = 0; row < reelHeights[col]; row++) {
      reel.push(pickWeightedSymbol());
    }
    grid.push(reel);
  }
  return grid;
}

function generateTopReel(): GameSymbol[] {
  const reel: GameSymbol[] = [];
  for (let i = 0; i < TOP_REEL_SIZE; i++) {
    reel.push(pickWeightedSymbol());
  }
  return reel;
}

function countScatters(grid: SymbolGrid, topReel: GameSymbol[]): number {
  let count = 0;
  for (const reel of grid) {
    for (const s of reel) {
      if (s === "scatter") count++;
    }
  }
  for (const s of topReel) {
    if (s === "scatter") count++;
  }
  return count;
}

function calculateTotalWays(reelHeights: number[]): number {
  return reelHeights.reduce((product, h) => product * h, 1);
}

interface WayWin {
  symbol: GameSymbol;
  count: number;
  ways: number;
  multiplier: number;
}

function evaluateWays(
  grid: SymbolGrid,
  topReel: GameSymbol[],
  betPerWay: number,
  bonusMultiplier: number
): { wayWins: WayWin[]; totalWin: number; hasWild: boolean } {
  const payingSymbols: GameSymbol[] = [
    "seven", "bar", "watermelon", "grape", "orange", "lemon", "cherry", "wild",
  ];
  const wayWins: WayWin[] = [];
  let totalWin = 0;
  let hasWild = false;

  for (const reel of grid) {
    if (reel.includes("wild")) { hasWild = true; break; }
  }
  if (!hasWild && topReel.includes("wild")) hasWild = true;

  for (const targetSymbol of payingSymbols) {
    let currentWays = 1;
    let matchReels = 0;
    let wildInvolved = false;

    for (let col = 0; col < grid.length; col++) {
      const reel = grid[col];
      let matchingPositions = 0;

      for (const s of reel) {
        if (s === targetSymbol || s === "wild") {
          matchingPositions++;
          if (s === "wild") wildInvolved = true;
        }
      }

      if (col >= 1 && col <= 4) {
        for (const s of topReel.slice(col - 1, col)) {
          if (s === targetSymbol || s === "wild") {
            matchingPositions++;
            if (s === "wild") wildInvolved = true;
          }
        }
      }

      if (matchingPositions === 0) break;
      currentWays *= matchingPositions;
      matchReels++;
    }

    if (matchReels >= 3) {
      const payoutPerWay = PAYOUT_TABLE[targetSymbol]?.[matchReels] ?? 0;
      const wildMult = wildInvolved ? 2 : 1;
      const win = payoutPerWay * currentWays * betPerWay * wildMult * bonusMultiplier;
      if (win > 0) {
        wayWins.push({
          symbol: targetSymbol,
          count: matchReels,
          ways: currentWays,
          multiplier: wildMult * bonusMultiplier,
        });
        totalWin += win;
      }
    }
  }

  return { wayWins, totalWin, hasWild };
}

export class MegawaysEngine implements IGameEngine {
  readonly config: GameConfig = {
    id: "megaways",
    name: "Mega Ways",
    reels: MAIN_REELS,
    rows: MAX_HEIGHT,
    paylines: 117649,
    symbols: MEGAWAYS_SYMBOLS,
    minBet: 0.10,
    maxBet: 500,
    denominations: DENOMINATIONS,
    bonusFreeSpins: 15,
    bonusMultiplier: 3,
    rtp: 0.967,
  };

  spin(bet: SpinRequest): SpinResult {
    const reelHeights = generateReelHeights();
    const grid = generateMegawaysGrid(reelHeights);
    const topReel = generateTopReel();
    const totalWays = calculateTotalWays(reelHeights);

    const bonusMultiplier = bet.bonus.isActive ? bet.bonus.multiplier : 1;
    const betPerWay = bet.betAmount / totalWays;

    const { wayWins, totalWin, hasWild } = evaluateWays(grid, topReel, betPerWay, bonusMultiplier);
    const scatterCount = countScatters(grid, topReel);
    const bonusResult = this.triggerBonus(grid, bet.bonus);

    const paylines: PaylineResult[] = wayWins.map((w, i) => ({
      paylineIndex: i,
      symbols: Array(w.count).fill(w.symbol) as GameSymbol[],
      winAmount: (PAYOUT_TABLE[w.symbol]?.[w.count] ?? 0) * w.ways * betPerWay * w.multiplier,
      isWin: true,
    }));

    const gridWithTop = [...grid, topReel];

    const wins: WinEvaluation = {
      lines: wayWins.map((w, i) => ({
        paylineIndex: i,
        symbols: Array(w.count).fill(w.symbol) as GameSymbol[],
        positions: Array.from({ length: w.count }, (_, idx) => [idx, 0] as [number, number]),
        winAmount: (PAYOUT_TABLE[w.symbol]?.[w.count] ?? 0) * w.ways * betPerWay * w.multiplier,
        multiplier: w.multiplier,
      })),
      scatterWin: scatterCount >= 4
        ? (SCATTER_PAYOUTS[scatterCount] ?? 0) * bet.betAmount * bonusMultiplier
        : 0,
      totalWin: totalWin + (scatterCount >= 4
        ? (SCATTER_PAYOUTS[scatterCount] ?? 0) * bet.betAmount * bonusMultiplier
        : 0),
      hasWild,
      scatterCount,
    };

    return {
      reels: gridWithTop,
      paylines,
      totalWin: wins.totalWin,
      bonusTriggered: bonusResult.triggered || (scatterCount >= 4 && !bet.bonus.isActive),
      scatterCount,
      gameType: "megaways",
      wins,
      reelHeights,
    };
  }

  evaluateWins(grid: SymbolGrid, betPerLine: number): WinEvaluation {
    const topReel = grid.length > MAIN_REELS ? grid[grid.length - 1] : [];
    const mainGrid = grid.slice(0, MAIN_REELS);
    const reelHeights = mainGrid.map((r) => r.length);
    const totalWays = calculateTotalWays(reelHeights);
    const betPerWay = betPerLine / totalWays;

    const { wayWins, totalWin, hasWild } = evaluateWays(mainGrid, topReel, betPerWay, 1);
    const scatterCount = countScatters(mainGrid, topReel);

    return {
      lines: wayWins.map((w, i) => ({
        paylineIndex: i,
        symbols: Array(w.count).fill(w.symbol) as GameSymbol[],
        positions: Array.from({ length: w.count }, (_, idx) => [idx, 0] as [number, number]),
        winAmount: (PAYOUT_TABLE[w.symbol]?.[w.count] ?? 0) * w.ways * betPerWay * w.multiplier,
        multiplier: w.multiplier,
      })),
      scatterWin: 0,
      totalWin,
      hasWild,
      scatterCount,
    };
  }

  triggerBonus(grid: SymbolGrid, state: BonusState): BonusResult {
    const scatterCount = countScatters(grid, []);
    if (scatterCount >= 4 && !state.isActive) {
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
