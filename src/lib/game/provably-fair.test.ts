import { describe, it, expect } from "vitest";
import {
  generateServerSeed,
  hashServerSeed,
  generateClientSeed,
  deriveFloat,
  deriveFloats,
  floatToInt,
  verifyServerSeed,
  verifySpinResult,
  createSeedPair,
} from "./provably-fair";

describe("provably-fair", () => {
  describe("generateServerSeed", () => {
    it("generates 64-char hex string (32 bytes)", () => {
      const seed = generateServerSeed();
      expect(seed).toMatch(/^[a-f0-9]{64}$/);
    });

    it("generates unique seeds each time", () => {
      const seeds = new Set(Array.from({ length: 100 }, () => generateServerSeed()));
      expect(seeds.size).toBe(100);
    });
  });

  describe("hashServerSeed", () => {
    it("produces consistent SHA-256 hash", () => {
      const seed = "test-seed-123";
      const hash1 = hashServerSeed(seed);
      const hash2 = hashServerSeed(seed);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("different seeds produce different hashes", () => {
      const hash1 = hashServerSeed("seed-a");
      const hash2 = hashServerSeed("seed-b");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateClientSeed", () => {
    it("generates 32-char hex string (16 bytes)", () => {
      const seed = generateClientSeed();
      expect(seed).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("deriveFloat", () => {
    it("returns a float in [0, 1)", () => {
      const float = deriveFloat("server-seed", "client-seed", 0);
      expect(float).toBeGreaterThanOrEqual(0);
      expect(float).toBeLessThan(1);
    });

    it("is deterministic — same inputs produce same output", () => {
      const a = deriveFloat("server-seed", "client-seed", 42);
      const b = deriveFloat("server-seed", "client-seed", 42);
      expect(a).toBe(b);
    });

    it("different nonces produce different results", () => {
      const a = deriveFloat("server-seed", "client-seed", 0);
      const b = deriveFloat("server-seed", "client-seed", 1);
      expect(a).not.toBe(b);
    });

    it("different client seeds produce different results", () => {
      const a = deriveFloat("server-seed", "client-a", 0);
      const b = deriveFloat("server-seed", "client-b", 0);
      expect(a).not.toBe(b);
    });

    it("different server seeds produce different results", () => {
      const a = deriveFloat("server-a", "client-seed", 0);
      const b = deriveFloat("server-b", "client-seed", 0);
      expect(a).not.toBe(b);
    });
  });

  describe("deriveFloats", () => {
    it("returns the requested number of floats", () => {
      const floats = deriveFloats("server", "client", 0, 15);
      expect(floats).toHaveLength(15);
      floats.forEach((f) => {
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThan(1);
      });
    });

    it("is deterministic", () => {
      const a = deriveFloats("server", "client", 5, 20);
      const b = deriveFloats("server", "client", 5, 20);
      expect(a).toEqual(b);
    });

    it("handles requesting more than 8 floats (multi-cursor)", () => {
      const floats = deriveFloats("server", "client", 0, 25);
      expect(floats).toHaveLength(25);
      // All should be unique (extremely unlikely collision)
      const unique = new Set(floats);
      expect(unique.size).toBe(25);
    });
  });

  describe("floatToInt", () => {
    it("maps 0.0 to 0", () => {
      expect(floatToInt(0.0, 10)).toBe(0);
    });

    it("maps 0.999 to max-1", () => {
      expect(floatToInt(0.999, 10)).toBe(9);
    });

    it("maps 0.5 to mid-range", () => {
      expect(floatToInt(0.5, 100)).toBe(50);
    });
  });

  describe("verifyServerSeed", () => {
    it("returns true for matching seed and hash", () => {
      const seed = generateServerSeed();
      const hash = hashServerSeed(seed);
      expect(verifyServerSeed(seed, hash)).toBe(true);
    });

    it("returns false for non-matching seed", () => {
      const hash = hashServerSeed("real-seed");
      expect(verifyServerSeed("fake-seed", hash)).toBe(false);
    });
  });

  describe("verifySpinResult", () => {
    it("verifies correct floats", () => {
      const serverSeed = "known-server-seed";
      const clientSeed = "known-client-seed";
      const nonce = 7;
      const expected = deriveFloats(serverSeed, clientSeed, nonce, 5);
      expect(
        verifySpinResult(serverSeed, clientSeed, nonce, expected)
      ).toBe(true);
    });

    it("rejects tampered floats", () => {
      const serverSeed = "known-server-seed";
      const clientSeed = "known-client-seed";
      const nonce = 7;
      const expected = deriveFloats(serverSeed, clientSeed, nonce, 5);
      expected[2] = 0.999; // tamper
      expect(
        verifySpinResult(serverSeed, clientSeed, nonce, expected)
      ).toBe(false);
    });
  });

  describe("createSeedPair", () => {
    it("creates valid seed pair with nonce=0", () => {
      const pair = createSeedPair();
      expect(pair.serverSeed).toMatch(/^[a-f0-9]{64}$/);
      expect(pair.serverSeedHash).toMatch(/^[a-f0-9]{64}$/);
      expect(pair.clientSeed).toMatch(/^[a-f0-9]{32}$/);
      expect(pair.nonce).toBe(0);
    });

    it("hash matches server seed", () => {
      const pair = createSeedPair();
      expect(verifyServerSeed(pair.serverSeed, pair.serverSeedHash)).toBe(true);
    });
  });

  describe("immutable seed order", () => {
    it("nonce sequence produces unique, reproducible results", () => {
      const serverSeed = generateServerSeed();
      const clientSeed = generateClientSeed();

      const sequence = Array.from({ length: 100 }, (_, i) =>
        deriveFloat(serverSeed, clientSeed, i)
      );

      // Verify uniqueness
      const unique = new Set(sequence);
      expect(unique.size).toBe(100);

      // Verify reproducibility
      const replay = Array.from({ length: 100 }, (_, i) =>
        deriveFloat(serverSeed, clientSeed, i)
      );
      expect(replay).toEqual(sequence);
    });
  });

  describe("distribution sanity", () => {
    it("floats are roughly uniformly distributed", () => {
      const serverSeed = generateServerSeed();
      const clientSeed = generateClientSeed();
      const n = 10000;
      const floats = Array.from({ length: n }, (_, i) =>
        deriveFloat(serverSeed, clientSeed, i)
      );

      const mean = floats.reduce((a, b) => a + b, 0) / n;
      // Mean should be close to 0.5 (within ~0.02 for 10k samples)
      expect(mean).toBeGreaterThan(0.45);
      expect(mean).toBeLessThan(0.55);

      // Check quartile distribution
      const q1 = floats.filter((f) => f < 0.25).length / n;
      const q2 = floats.filter((f) => f >= 0.25 && f < 0.5).length / n;
      const q3 = floats.filter((f) => f >= 0.5 && f < 0.75).length / n;
      const q4 = floats.filter((f) => f >= 0.75).length / n;

      // Each quartile should be roughly 25% (within 5%)
      [q1, q2, q3, q4].forEach((q) => {
        expect(q).toBeGreaterThan(0.20);
        expect(q).toBeLessThan(0.30);
      });
    });
  });
});
