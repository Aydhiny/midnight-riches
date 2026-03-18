import { describe, it, expect } from "vitest";
import { CREDIT_BUNDLES, getBundleById, WELCOME_CREDITS, DAILY_BONUS_CREDITS } from "./index";

describe("stripe config", () => {
  describe("CREDIT_BUNDLES", () => {
    it("has exactly 4 bundles", () => {
      expect(CREDIT_BUNDLES).toHaveLength(4);
    });

    it("all bundles have required fields", () => {
      CREDIT_BUNDLES.forEach((bundle) => {
        expect(bundle.id).toBeTruthy();
        expect(bundle.name).toBeTruthy();
        expect(bundle.credits).toBeGreaterThan(0);
        expect(bundle.priceUsd).toBeGreaterThan(0);
        expect(bundle.stripePriceId).toBeTruthy();
      });
    });

    it("bundles are sorted by price ascending", () => {
      for (let i = 1; i < CREDIT_BUNDLES.length; i++) {
        expect(CREDIT_BUNDLES[i].priceUsd).toBeGreaterThan(
          CREDIT_BUNDLES[i - 1].priceUsd
        );
      }
    });

    it("exactly one bundle is marked popular", () => {
      const popular = CREDIT_BUNDLES.filter((b) => b.popular);
      expect(popular).toHaveLength(1);
      expect(popular[0].id).toBe("popular");
    });

    it("higher price gives more credits per dollar", () => {
      const ratios = CREDIT_BUNDLES.map(
        (b) => b.credits / b.priceUsd
      );
      // Each tier should offer better value than the previous
      for (let i = 1; i < ratios.length; i++) {
        expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
      }
    });

    it("all bundle IDs are unique", () => {
      const ids = CREDIT_BUNDLES.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getBundleById", () => {
    it("finds existing bundle", () => {
      const bundle = getBundleById("starter");
      expect(bundle).toBeDefined();
      expect(bundle?.id).toBe("starter");
    });

    it("returns undefined for non-existent bundle", () => {
      expect(getBundleById("nonexistent")).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(getBundleById("")).toBeUndefined();
    });
  });

  describe("constants", () => {
    it("WELCOME_CREDITS is 500", () => {
      expect(WELCOME_CREDITS).toBe(500);
    });

    it("DAILY_BONUS_CREDITS is 50", () => {
      expect(DAILY_BONUS_CREDITS).toBe(50);
    });
  });
});
