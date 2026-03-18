import { describe, it, expect } from "vitest";
import { deriveReelGrid } from "./integrity-validator";
import { generateServerSeed, generateClientSeed, hashServerSeed } from "../game/provably-fair";
import { verifySpinLocally } from "./integrity-validator";

describe("integrity-validator", () => {
  describe("deriveReelGrid", () => {
    it("produces a grid of correct dimensions for classic (3x3)", () => {
      const grid = deriveReelGrid("server-seed", "client-seed", 0, 3, 3);
      expect(grid).toHaveLength(3);
      grid.forEach((reel) => {
        expect(reel).toHaveLength(3);
        reel.forEach((symbol) => {
          expect(typeof symbol).toBe("string");
        });
      });
    });

    it("produces a grid of correct dimensions for five-reel (5x3)", () => {
      const grid = deriveReelGrid("server-seed", "client-seed", 0, 5, 3);
      expect(grid).toHaveLength(5);
      grid.forEach((reel) => expect(reel).toHaveLength(3));
    });

    it("produces a grid of correct dimensions for cascade (5x5)", () => {
      const grid = deriveReelGrid("server-seed", "client-seed", 0, 5, 5);
      expect(grid).toHaveLength(5);
      grid.forEach((reel) => expect(reel).toHaveLength(5));
    });

    it("is deterministic — same inputs produce same grid", () => {
      const a = deriveReelGrid("server", "client", 42, 5, 3);
      const b = deriveReelGrid("server", "client", 42, 5, 3);
      expect(a).toEqual(b);
    });

    it("different nonces produce different grids", () => {
      const a = deriveReelGrid("server", "client", 0, 5, 3);
      const b = deriveReelGrid("server", "client", 1, 5, 3);
      expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    });

    it("all symbols are valid GameSymbol values", () => {
      const validSymbols = [
        "cherry", "lemon", "orange", "grape", "watermelon",
        "wild", "scatter", "seven", "bar",
      ];
      const grid = deriveReelGrid("test", "test", 0, 6, 4);
      grid.flat().forEach((symbol) => {
        expect(validSymbols).toContain(symbol);
      });
    });
  });

  describe("verifySpinLocally", () => {
    it("validates a correct spin result", () => {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = generateClientSeed();
      const nonce = 5;

      const expectedReels = deriveReelGrid(serverSeed, clientSeed, nonce, 5, 3);

      const result = verifySpinLocally(
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        expectedReels,
        "five-reel"
      );

      expect(result.valid).toBe(true);
    });

    it("rejects a tampered server seed", () => {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = generateClientSeed();
      const nonce = 5;

      const expectedReels = deriveReelGrid(serverSeed, clientSeed, nonce, 5, 3);

      const result = verifySpinLocally(
        "fake-server-seed",
        serverSeedHash,
        clientSeed,
        nonce,
        expectedReels,
        "five-reel"
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("hash");
    });

    it("rejects tampered reel results", () => {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = generateClientSeed();
      const nonce = 5;

      const expectedReels = deriveReelGrid(serverSeed, clientSeed, nonce, 5, 3);
      // Tamper with one symbol
      expectedReels[0][0] = expectedReels[0][0] === "cherry" ? "lemon" : "cherry";

      const result = verifySpinLocally(
        serverSeed,
        serverSeedHash,
        clientSeed,
        nonce,
        expectedReels,
        "five-reel"
      );

      expect(result.valid).toBe(false);
      expect(result.reason).toContain("grid");
    });

    it("works for classic game type (3x3)", () => {
      const serverSeed = generateServerSeed();
      const serverSeedHash = hashServerSeed(serverSeed);
      const clientSeed = generateClientSeed();

      const expectedReels = deriveReelGrid(serverSeed, clientSeed, 0, 3, 3);

      const result = verifySpinLocally(
        serverSeed,
        serverSeedHash,
        clientSeed,
        0,
        expectedReels,
        "classic"
      );

      expect(result.valid).toBe(true);
    });
  });
});
