import type { GameSymbol, ReelResult, PaylineResult, SpinResult, BonusState } from "@/types";
import {
  REEL_SYMBOLS,
  SYMBOLS,
  PAYLINES,
  NUM_REELS,
  NUM_ROWS,
  BONUS_FREE_SPINS,
  BONUS_MULTIPLIER,
} from "./symbols";
import { secureRandomInt } from "./rng";

function pickSymbol(): GameSymbol {
  const index = secureRandomInt(REEL_SYMBOLS.length);
  return REEL_SYMBOLS[index];
}

export function generateReels(): ReelResult {
  const reels: ReelResult = [];
  for (let col = 0; col < NUM_REELS; col++) {
    const reel: GameSymbol[] = [];
    for (let row = 0; row < NUM_ROWS; row++) {
      reel.push(pickSymbol());
    }
    reels.push(reel);
  }
  return reels;
}

function evaluatePayline(
  reels: ReelResult,
  payline: [number, number][],
  paylineIndex: number,
  betPerLine: number,
  multiplier: number
): PaylineResult {
  const symbols = payline.map(([col, row]) => reels[col][row]);

  const baseSymbol = symbols[0] === "wild" ? symbols.find((s) => s !== "wild") ?? "wild" : symbols[0];

  let matchCount = 0;
  for (const symbol of symbols) {
    if (symbol === baseSymbol || symbol === "wild") {
      matchCount++;
    } else {
      break;
    }
  }

  const config = SYMBOLS[baseSymbol];
  const payout = config.payouts[matchCount] ?? 0;
  const winAmount = payout * betPerLine * multiplier;

  return {
    paylineIndex,
    symbols,
    winAmount,
    isWin: winAmount > 0,
  };
}

function countScatters(reels: ReelResult): number {
  let count = 0;
  for (const reel of reels) {
    for (const symbol of reel) {
      if (symbol === "scatter") {
        count++;
      }
    }
  }
  return count;
}

export function evaluateSpin(
  reels: ReelResult,
  betPerLine: number,
  bonus: BonusState
): SpinResult {
  const multiplier = bonus.isActive ? bonus.multiplier : 1;

  const paylines = PAYLINES.map((payline, index) =>
    evaluatePayline(reels, payline, index, betPerLine, multiplier)
  );

  const paylineWin = paylines.reduce((sum, p) => sum + p.winAmount, 0);
  const scatterCount = countScatters(reels);

  const scatterPayout = scatterCount >= 2 ? (SYMBOLS.scatter.payouts[scatterCount] ?? 0) * betPerLine * PAYLINES.length * multiplier : 0;

  const totalWin = paylineWin + scatterPayout;
  const bonusTriggered = scatterCount >= 3 && !bonus.isActive;

  return {
    reels,
    paylines,
    totalWin,
    bonusTriggered,
    scatterCount,
    gameType: "classic" as const,
  };
}

export function createInitialBonusState(): BonusState {
  return {
    isActive: false,
    spinsRemaining: 0,
    multiplier: 1,
    totalBonusWin: 0,
  };
}

export function activateBonus(): BonusState {
  return {
    isActive: true,
    spinsRemaining: BONUS_FREE_SPINS,
    multiplier: BONUS_MULTIPLIER,
    totalBonusWin: 0,
  };
}

export function updateBonusAfterSpin(bonus: BonusState, winAmount: number): BonusState {
  if (!bonus.isActive) return bonus;

  const remaining = bonus.spinsRemaining - 1;
  return {
    isActive: remaining > 0,
    spinsRemaining: remaining,
    multiplier: remaining > 0 ? bonus.multiplier : 1,
    totalBonusWin: bonus.totalBonusWin + winAmount,
  };
}

export function executeSpin(betPerLine: number, bonus: BonusState): {
  result: SpinResult;
  newBonus: BonusState;
} {
  const reels = generateReels();
  const result = evaluateSpin(reels, betPerLine, bonus);

  let newBonus = bonus;
  if (result.bonusTriggered) {
    newBonus = activateBonus();
  } else if (bonus.isActive) {
    newBonus = updateBonusAfterSpin(bonus, result.totalWin);
  }

  return { result, newBonus };
}
