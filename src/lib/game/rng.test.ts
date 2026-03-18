import { describe, it, expect } from "vitest";
import { secureRandomInt, secureRandomFloat, shuffleArray } from "./rng";
import { REEL_SYMBOLS, SYMBOLS } from "./symbols";
import type { GameSymbol } from "@/types";

describe("secureRandomInt", () => {
  it("returns values within range [0, max)", () => {
    for (let i = 0; i < 1000; i++) {
      const val = secureRandomInt(10);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(10);
    }
  });

  it("returns 0 for max=1", () => {
    for (let i = 0; i < 100; i++) {
      expect(secureRandomInt(1)).toBe(0);
    }
  });
});

describe("secureRandomFloat", () => {
  it("returns values in [0, 1)", () => {
    for (let i = 0; i < 1000; i++) {
      const val = secureRandomFloat();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("shuffleArray", () => {
  it("preserves all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5] as const;
    shuffleArray(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("statistical distribution (100,000 spins)", () => {
  it("each symbol appears within ±2% of expected probability", () => {
    const totalSymbols = REEL_SYMBOLS.length;
    const symbolWeights: Record<string, number> = {};
    for (const [id, config] of Object.entries(SYMBOLS)) {
      symbolWeights[id] = config.weight;
    }
    const totalWeight = Object.values(symbolWeights).reduce((a, b) => a + b, 0);

    const counts: Record<string, number> = {};
    for (const sym of Object.keys(SYMBOLS)) {
      counts[sym] = 0;
    }

    const N = 100_000;
    for (let i = 0; i < N; i++) {
      const index = secureRandomInt(totalSymbols);
      const symbol = REEL_SYMBOLS[index];
      counts[symbol]++;
    }

    for (const [symbol, weight] of Object.entries(symbolWeights)) {
      const expectedProbability = weight / totalWeight;
      const actualProbability = counts[symbol] / N;
      const deviation = Math.abs(actualProbability - expectedProbability);
      expect(deviation).toBeLessThan(0.02);
    }
  });
});
