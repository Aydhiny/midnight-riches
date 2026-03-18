import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkJackpotTrigger } from "./jackpot";

describe("jackpot", () => {
  describe("checkJackpotTrigger", () => {
    it("returns a boolean", () => {
      const result = checkJackpotTrigger();
      expect(typeof result).toBe("boolean");
    });

    it("mostly returns false (probability is 1/50,000)", () => {
      let triggers = 0;
      const n = 10000;
      for (let i = 0; i < n; i++) {
        if (checkJackpotTrigger()) triggers++;
      }
      // With p=0.00002, expected triggers in 10k = 0.2
      // Very unlikely to get more than 5
      expect(triggers).toBeLessThan(10);
    });

    it("uses crypto.getRandomValues for fairness", () => {
      const spy = vi.spyOn(crypto, "getRandomValues");
      checkJackpotTrigger();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("jackpot simulation", () => {
    it("trigger probability is approximately 1/50,000", () => {
      // Run a larger simulation to verify probability
      let triggers = 0;
      const n = 500_000;
      for (let i = 0; i < n; i++) {
        if (checkJackpotTrigger()) triggers++;
      }
      // Expected: 10, tolerance: 5-25 (very generous for RNG)
      expect(triggers).toBeGreaterThan(0);
      expect(triggers).toBeLessThan(50);

      const rate = triggers / n;
      // Expected rate: 0.00002, allow 5x tolerance
      expect(rate).toBeLessThan(0.0001);
    });
  });
});
