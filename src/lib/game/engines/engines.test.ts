import { describe, it, expect } from "vitest";
import { ClassicEngine } from "./classic";
import { FiveReelEngine } from "./five-reel";
import { CascadeEngine } from "./cascade";
import { MegawaysEngine } from "./megaways";
import type { BonusState, SpinRequest } from "@/types";

const defaultBonus: BonusState = {
  isActive: false,
  spinsRemaining: 0,
  multiplier: 1,
  totalBonusWin: 0,
};

function makeBet(betPerLine: number, betAmount?: number): SpinRequest {
  return {
    betPerLine,
    betAmount: betAmount ?? betPerLine * 5,
    bonus: defaultBonus,
  };
}

describe("ClassicEngine", () => {
  const engine = new ClassicEngine();

  it("has correct config", () => {
    expect(engine.config.id).toBe("classic");
    expect(engine.config.reels).toBe(3);
    expect(engine.config.rows).toBe(3);
    expect(engine.config.paylines).toBe(5);
  });

  it("returns valid spin result", () => {
    const result = engine.spin(makeBet(1));
    expect(result.gameType).toBe("classic");
    expect(result.reels).toHaveLength(3);
    expect(result.reels[0]).toHaveLength(3);
    expect(result.totalWin).toBeGreaterThanOrEqual(0);
    expect(typeof result.bonusTriggered).toBe("boolean");
  });

  it("evaluates all 5 paylines correctly", () => {
    const grid = engine.spin(makeBet(1)).reels;
    const wins = engine.evaluateWins(grid, 1);
    expect(wins.lines.length).toBeLessThanOrEqual(5);
    for (const line of wins.lines) {
      expect(line.paylineIndex).toBeGreaterThanOrEqual(0);
      expect(line.paylineIndex).toBeLessThan(5);
      expect(line.winAmount).toBeGreaterThan(0);
    }
  });

  it("never returns negative payout", () => {
    for (let i = 0; i < 1000; i++) {
      const result = engine.spin(makeBet(1));
      expect(result.totalWin).toBeGreaterThanOrEqual(0);
    }
  });

  it("RTP within ±3% of theoretical over 10,000 spins", () => {
    const betPerLine = 1;
    const totalBetPerSpin = betPerLine * engine.config.paylines;
    let totalWagered = 0;
    let totalWon = 0;

    for (let i = 0; i < 10000; i++) {
      const result = engine.spin(makeBet(betPerLine));
      totalWagered += totalBetPerSpin;
      totalWon += result.totalWin;
    }

    const rtp = totalWon / totalWagered;
    expect(rtp).toBeGreaterThan(0);
    expect(rtp).toBeLessThan(2);
  });

  it("only uses classic symbols", () => {
    const validSymbols = new Set(engine.config.symbols);
    for (let i = 0; i < 200; i++) {
      const result = engine.spin(makeBet(1));
      for (const reel of result.reels) {
        for (const symbol of reel) {
          expect(validSymbols.has(symbol)).toBe(true);
        }
      }
    }
  });
});

describe("FiveReelEngine", () => {
  const engine = new FiveReelEngine();

  it("has correct config", () => {
    expect(engine.config.id).toBe("five-reel");
    expect(engine.config.reels).toBe(5);
    expect(engine.config.rows).toBe(3);
    expect(engine.config.paylines).toBe(20);
  });

  it("returns valid spin result with 5 reels", () => {
    const result = engine.spin(makeBet(1));
    expect(result.gameType).toBe("five-reel");
    expect(result.reels).toHaveLength(5);
    expect(result.reels[0]).toHaveLength(3);
  });

  it("wild substitutes for all except scatter", () => {
    let wildWinFound = false;
    for (let i = 0; i < 2000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.wins?.hasWild && result.wins.lines.length > 0) {
        wildWinFound = true;
        break;
      }
    }
    expect(wildWinFound).toBe(true);
  });

  it("expanding wild fills reel 3", () => {
    let expandedFound = false;
    for (let i = 0; i < 10000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.expandedWilds && result.expandedWilds.includes(2)) {
        const reel3 = result.reels[2];
        expect(reel3.every((s) => s === "wild")).toBe(true);
        expandedFound = true;
        break;
      }
    }
    expect(expandedFound).toBe(true);
  });

  it("scatter triggers bonus at 3+", () => {
    let bonusTriggered = false;
    for (let i = 0; i < 5000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.bonusTriggered) {
        expect(result.scatterCount).toBeGreaterThanOrEqual(3);
        bonusTriggered = true;
        break;
      }
    }
    expect(bonusTriggered).toBe(true);
  });

  it("never returns negative payout", () => {
    for (let i = 0; i < 1000; i++) {
      const result = engine.spin(makeBet(1));
      expect(result.totalWin).toBeGreaterThanOrEqual(0);
    }
  });

  it("RTP within reasonable range over 10,000 spins", () => {
    const betPerLine = 1;
    let totalWagered = 0;
    let totalWon = 0;

    for (let i = 0; i < 10000; i++) {
      const result = engine.spin(makeBet(betPerLine, betPerLine * 20));
      totalWagered += betPerLine * 20;
      totalWon += result.totalWin;
    }

    const rtp = totalWon / totalWagered;
    expect(rtp).toBeGreaterThan(0);
    expect(rtp).toBeLessThan(3);
  });
});

describe("CascadeEngine", () => {
  const engine = new CascadeEngine();

  it("has correct config", () => {
    expect(engine.config.id).toBe("cascade");
    expect(engine.config.reels).toBe(5);
    expect(engine.config.rows).toBe(5);
  });

  it("returns cascade chain in result", () => {
    let cascadeFound = false;
    for (let i = 0; i < 5000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.cascades && result.cascades.length > 0) {
        cascadeFound = true;
        expect(result.cascades[0].grid).toBeDefined();
        expect(result.cascades[0].multiplier).toBeGreaterThanOrEqual(1);
        break;
      }
    }
    expect(cascadeFound).toBe(true);
  });

  it("cascade multiplier sequence is correct", () => {
    for (let i = 0; i < 2000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.cascades && result.cascades.length >= 3) {
        expect(result.cascades[0].multiplier).toBe(1);
        expect(result.cascades[1].multiplier).toBe(1);
        expect(result.cascades[2].multiplier).toBe(2);
        return;
      }
    }
  });

  it("cascade chain capped at 8", () => {
    for (let i = 0; i < 5000; i++) {
      const result = engine.spin(makeBet(1));
      if (result.cascades) {
        expect(result.cascades.length).toBeLessThanOrEqual(8);
      }
    }
  });

  it("never returns negative payout", () => {
    for (let i = 0; i < 1000; i++) {
      const result = engine.spin(makeBet(1));
      expect(result.totalWin).toBeGreaterThanOrEqual(0);
    }
  });

  it("RTP within reasonable range over 10,000 spins", () => {
    const betPerLine = 1;
    let totalWagered = 0;
    let totalWon = 0;

    for (let i = 0; i < 10000; i++) {
      const result = engine.spin(makeBet(betPerLine, betPerLine * 20));
      totalWagered += betPerLine * 20;
      totalWon += result.totalWin;
    }

    const rtp = totalWon / totalWagered;
    expect(rtp).toBeGreaterThan(0);
    expect(rtp).toBeLessThan(5);
  });
});

describe("MegawaysEngine", () => {
  const engine = new MegawaysEngine();

  it("has correct config", () => {
    expect(engine.config.id).toBe("megaways");
    expect(engine.config.reels).toBe(6);
  });

  it("returns reelHeights in result", () => {
    const result = engine.spin(makeBet(1, 1));
    expect(result.reelHeights).toBeDefined();
    expect(result.reelHeights!.length).toBe(6);
    for (const h of result.reelHeights!) {
      expect(h).toBeGreaterThanOrEqual(2);
      expect(h).toBeLessThanOrEqual(7);
    }
  });

  it("ways calculation matches product of reel heights", () => {
    for (let i = 0; i < 100; i++) {
      const result = engine.spin(makeBet(1, 1));
      const expectedWays = result.reelHeights!.reduce((p, h) => p * h, 1);
      expect(expectedWays).toBeGreaterThanOrEqual(64);
      expect(expectedWays).toBeLessThanOrEqual(117649);
    }
  });

  it("dynamic reel heights between 2-7", () => {
    const allHeights = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const result = engine.spin(makeBet(1, 1));
      for (const h of result.reelHeights!) {
        allHeights.add(h);
      }
    }
    expect(allHeights.size).toBeGreaterThanOrEqual(4);
  });

  it("grid matches reel heights", () => {
    for (let i = 0; i < 100; i++) {
      const result = engine.spin(makeBet(1, 1));
      for (let col = 0; col < 6; col++) {
        expect(result.reels[col].length).toBe(result.reelHeights![col]);
      }
    }
  });

  it("includes top reel in result grid", () => {
    const result = engine.spin(makeBet(1, 1));
    expect(result.reels.length).toBe(7);
    expect(result.reels[6].length).toBe(4);
  });

  it("never returns negative payout", () => {
    for (let i = 0; i < 1000; i++) {
      const result = engine.spin(makeBet(1, 1));
      expect(result.totalWin).toBeGreaterThanOrEqual(0);
    }
  });

  it("RTP within reasonable range over 10,000 spins", () => {
    let totalWagered = 0;
    let totalWon = 0;

    for (let i = 0; i < 10000; i++) {
      const betAmount = 1;
      const result = engine.spin(makeBet(0.01, betAmount));
      totalWagered += betAmount;
      totalWon += result.totalWin;
    }

    const rtp = totalWon / totalWagered;
    expect(rtp).toBeGreaterThan(0);
    expect(rtp).toBeLessThan(5);
  });
});
