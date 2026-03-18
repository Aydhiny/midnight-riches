import { describe, it, expect } from "vitest";
import {
  generateReels,
  evaluateSpin,
  executeSpin,
  createInitialBonusState,
  activateBonus,
  updateBonusAfterSpin,
} from "./engine";
import { SYMBOLS, NUM_REELS, NUM_ROWS, PAYLINES, BONUS_FREE_SPINS, BONUS_MULTIPLIER } from "./symbols";
import type { GameSymbol, ReelResult, BonusState } from "@/types";

describe("generateReels", () => {
  it("returns correct grid dimensions", () => {
    const reels = generateReels();
    expect(reels).toHaveLength(NUM_REELS);
    for (const reel of reels) {
      expect(reel).toHaveLength(NUM_ROWS);
    }
  });

  it("only contains valid symbols", () => {
    const validSymbols = Object.keys(SYMBOLS);
    const reels = generateReels();
    for (const reel of reels) {
      for (const symbol of reel) {
        expect(validSymbols).toContain(symbol);
      }
    }
  });
});

describe("payout evaluation", () => {
  const noBonusState = createInitialBonusState();

  it("3 cherries on middle row pays 25x bet per line", () => {
    const reels: ReelResult = [
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    const middlePayline = result.paylines[0];
    expect(middlePayline.winAmount).toBe(25);
    expect(middlePayline.isWin).toBe(true);
  });

  it("3 watermelons pays 75x bet per line", () => {
    const reels: ReelResult = [
      ["watermelon", "lemon", "lemon"],
      ["watermelon", "lemon", "lemon"],
      ["watermelon", "lemon", "lemon"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    const topPayline = result.paylines[1];
    expect(topPayline.winAmount).toBe(75);
  });

  it("3 wilds pays 100x bet per line", () => {
    const reels: ReelResult = [
      ["lemon", "wild", "lemon"],
      ["lemon", "wild", "lemon"],
      ["lemon", "wild", "lemon"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    const middlePayline = result.paylines[0];
    expect(middlePayline.winAmount).toBe(100);
  });

  it("wild substitutes for other symbols", () => {
    const reels: ReelResult = [
      ["lemon", "grape", "lemon"],
      ["lemon", "wild", "lemon"],
      ["lemon", "grape", "lemon"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    const middlePayline = result.paylines[0];
    expect(middlePayline.winAmount).toBe(50);
    expect(middlePayline.isWin).toBe(true);
  });

  it("no matching symbols returns 0 win", () => {
    const reels: ReelResult = [
      ["cherry", "cherry", "cherry"],
      ["lemon", "lemon", "lemon"],
      ["orange", "orange", "orange"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    const middlePayline = result.paylines[0];
    expect(middlePayline.winAmount).toBe(0);
    expect(middlePayline.isWin).toBe(false);
  });

  it("no combination returns negative payout", () => {
    const symbols: GameSymbol[] = ["cherry", "lemon", "orange", "grape", "watermelon", "wild", "scatter"];
    for (const s1 of symbols) {
      for (const s2 of symbols) {
        for (const s3 of symbols) {
          const reels: ReelResult = [
            [s1, s1, s1],
            [s2, s2, s2],
            [s3, s3, s3],
          ];
          const result = evaluateSpin(reels, 1, noBonusState);
          expect(result.totalWin).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("every symbol has non-negative payouts for all match counts", () => {
    for (const config of Object.values(SYMBOLS)) {
      for (const payout of Object.values(config.payouts)) {
        expect(payout).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("bet multiplier scales linearly", () => {
    const reels: ReelResult = [
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
    ];
    const result1 = evaluateSpin(reels, 1, noBonusState);
    const result2 = evaluateSpin(reels, 5, noBonusState);
    expect(result2.paylines[0].winAmount).toBe(result1.paylines[0].winAmount * 5);
  });
});

describe("scatter and bonus trigger", () => {
  const noBonusState = createInitialBonusState();

  it("3 scatters trigger bonus", () => {
    const reels: ReelResult = [
      ["scatter", "lemon", "lemon"],
      ["lemon", "scatter", "lemon"],
      ["lemon", "lemon", "scatter"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    expect(result.bonusTriggered).toBe(true);
    expect(result.scatterCount).toBe(3);
  });

  it("2 scatters do NOT trigger bonus", () => {
    const reels: ReelResult = [
      ["scatter", "lemon", "lemon"],
      ["lemon", "scatter", "lemon"],
      ["lemon", "lemon", "lemon"],
    ];
    const result = evaluateSpin(reels, 1, noBonusState);
    expect(result.bonusTriggered).toBe(false);
    expect(result.scatterCount).toBe(2);
  });

  it("bonus does not re-trigger when already active", () => {
    const activeBonus: BonusState = {
      isActive: true,
      spinsRemaining: 5,
      multiplier: BONUS_MULTIPLIER,
      totalBonusWin: 0,
    };
    const reels: ReelResult = [
      ["scatter", "scatter", "scatter"],
      ["scatter", "scatter", "scatter"],
      ["scatter", "scatter", "scatter"],
    ];
    const result = evaluateSpin(reels, 1, activeBonus);
    expect(result.bonusTriggered).toBe(false);
  });

  it("bonus multiplier applies to wins", () => {
    const activeBonus: BonusState = {
      isActive: true,
      spinsRemaining: 5,
      multiplier: BONUS_MULTIPLIER,
      totalBonusWin: 0,
    };
    const reels: ReelResult = [
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
      ["lemon", "cherry", "lemon"],
    ];
    const normalResult = evaluateSpin(reels, 1, noBonusState);
    const bonusResult = evaluateSpin(reels, 1, activeBonus);
    expect(bonusResult.paylines[0].winAmount).toBe(normalResult.paylines[0].winAmount * BONUS_MULTIPLIER);
  });
});

describe("bonus state management", () => {
  it("createInitialBonusState returns inactive state", () => {
    const state = createInitialBonusState();
    expect(state.isActive).toBe(false);
    expect(state.spinsRemaining).toBe(0);
    expect(state.multiplier).toBe(1);
    expect(state.totalBonusWin).toBe(0);
  });

  it("activateBonus returns correct initial bonus", () => {
    const state = activateBonus();
    expect(state.isActive).toBe(true);
    expect(state.spinsRemaining).toBe(BONUS_FREE_SPINS);
    expect(state.multiplier).toBe(BONUS_MULTIPLIER);
    expect(state.totalBonusWin).toBe(0);
  });

  it("updateBonusAfterSpin decrements spins remaining", () => {
    const bonus = activateBonus();
    const updated = updateBonusAfterSpin(bonus, 50);
    expect(updated.spinsRemaining).toBe(BONUS_FREE_SPINS - 1);
    expect(updated.totalBonusWin).toBe(50);
    expect(updated.isActive).toBe(true);
  });

  it("bonus deactivates when spins reach 0", () => {
    const bonus: BonusState = {
      isActive: true,
      spinsRemaining: 1,
      multiplier: BONUS_MULTIPLIER,
      totalBonusWin: 100,
    };
    const updated = updateBonusAfterSpin(bonus, 25);
    expect(updated.isActive).toBe(false);
    expect(updated.spinsRemaining).toBe(0);
    expect(updated.multiplier).toBe(1);
    expect(updated.totalBonusWin).toBe(125);
  });

  it("updateBonusAfterSpin is no-op for inactive bonus", () => {
    const bonus = createInitialBonusState();
    const updated = updateBonusAfterSpin(bonus, 50);
    expect(updated).toBe(bonus);
  });
});

describe("executeSpin", () => {
  it("returns valid spin result and bonus state", () => {
    const bonus = createInitialBonusState();
    const { result, newBonus } = executeSpin(1, bonus);

    expect(result.reels).toHaveLength(NUM_REELS);
    expect(result.paylines).toHaveLength(PAYLINES.length);
    expect(result.totalWin).toBeGreaterThanOrEqual(0);
    expect(typeof result.bonusTriggered).toBe("boolean");
    expect(typeof newBonus.isActive).toBe("boolean");
  });
});
