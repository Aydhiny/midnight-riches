import { createHmac, randomBytes, createHash } from "crypto";

/**
 * Provably Fair System
 *
 * Flow:
 * 1. Server generates a random serverSeed
 * 2. Server hashes it (SHA-256) and gives the hash to the client BEFORE the spin
 * 3. Client provides a clientSeed (or uses default)
 * 4. Each spin increments a nonce
 * 5. Result = HMAC-SHA256(serverSeed, clientSeed:nonce)
 * 6. After seed rotation, server reveals the serverSeed
 * 7. Client can verify: SHA-256(serverSeed) === previously shown hash
 * 8. Client can re-derive all results from serverSeed + clientSeed + nonce
 */

export function generateServerSeed(): string {
  return randomBytes(32).toString("hex");
}

export function hashServerSeed(serverSeed: string): string {
  return createHash("sha256").update(serverSeed).digest("hex");
}

export function generateClientSeed(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Derive a deterministic float [0, 1) from seeds + nonce using HMAC-SHA256.
 * Takes the first 4 bytes of the HMAC and divides by 2^32.
 */
export function deriveFloat(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): number {
  const hmac = createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}`)
    .digest("hex");

  // Take first 8 hex chars (4 bytes = 32 bits)
  const int = parseInt(hmac.slice(0, 8), 16);
  return int / 0x100000000; // divide by 2^32
}

/**
 * Derive multiple floats from a single seed combination.
 * Uses cursor-based approach: HMAC once, then extract sequential 4-byte chunks.
 */
export function deriveFloats(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  count: number
): number[] {
  const results: number[] = [];
  let cursor = 0;

  while (results.length < count) {
    const hmac = createHmac("sha256", serverSeed)
      .update(`${clientSeed}:${nonce}:${cursor}`)
      .digest("hex");

    // Extract up to 8 floats per HMAC (64 hex chars / 8 chars per float)
    for (let i = 0; i < 8 && results.length < count; i++) {
      const hex = hmac.slice(i * 8, (i + 1) * 8);
      const int = parseInt(hex, 16);
      results.push(int / 0x100000000);
    }

    cursor++;
  }

  return results;
}

/**
 * Convert a float [0, 1) to an integer [0, max).
 */
export function floatToInt(float: number, max: number): number {
  return Math.floor(float * max);
}

/**
 * Verify that a serverSeed matches a previously committed hash.
 */
export function verifyServerSeed(
  serverSeed: string,
  expectedHash: string
): boolean {
  return hashServerSeed(serverSeed) === expectedHash;
}

/**
 * Full verification: given seeds, nonce, and expected results,
 * re-derive and compare.
 */
export function verifySpinResult(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  expectedFloats: number[],
  tolerance = 1e-10
): boolean {
  const derived = deriveFloats(serverSeed, clientSeed, nonce, expectedFloats.length);
  return derived.every(
    (val, idx) => Math.abs(val - expectedFloats[idx]) < tolerance
  );
}

/**
 * Create a new seed pair for a user session.
 */
export function createSeedPair() {
  const serverSeed = generateServerSeed();
  const serverSeedHash = hashServerSeed(serverSeed);
  const clientSeed = generateClientSeed();

  return {
    serverSeed,
    serverSeedHash,
    clientSeed,
    nonce: 0,
  };
}
