import { db } from "@/lib/db";
import { provablyFairSeeds } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  deriveFloats,
  verifyServerSeed,
  floatToInt,
} from "@/lib/game/provably-fair";
import { logger } from "@/lib/logger";
import type { GameSymbol, GameType } from "@/types";
import { SYMBOLS } from "@/lib/game/symbols";

interface IntegrityResult {
  valid: boolean;
  reason?: string;
}

const SYMBOL_LIST = Object.keys(SYMBOLS) as GameSymbol[];

/**
 * Re-derive reel results from provably fair seeds.
 * Given a game session's seed data, regenerate the expected symbol grid
 * and compare against the recorded result.
 */
export function deriveReelGrid(
  serverSeed: string,
  clientSeed: string,
  nonce: number,
  reels: number,
  rows: number
): GameSymbol[][] {
  const totalCells = reels * rows;
  const floats = deriveFloats(serverSeed, clientSeed, nonce, totalCells);

  const grid: GameSymbol[][] = [];
  let floatIdx = 0;

  for (let col = 0; col < reels; col++) {
    const reel: GameSymbol[] = [];
    for (let row = 0; row < rows; row++) {
      const symbolIdx = floatToInt(floats[floatIdx], SYMBOL_LIST.length);
      reel.push(SYMBOL_LIST[symbolIdx]);
      floatIdx++;
    }
    grid.push(reel);
  }

  return grid;
}

/**
 * Get reel dimensions for a game type.
 */
function getGameDimensions(gameType: GameType): { reels: number; rows: number } {
  switch (gameType) {
    case "classic":
      return { reels: 3, rows: 3 };
    case "five-reel":
      return { reels: 5, rows: 3 };
    case "cascade":
      return { reels: 5, rows: 5 };
    case "megaways":
      return { reels: 6, rows: 4 }; // base rows, actual varies
    default:
      return { reels: 5, rows: 3 };
  }
}

/**
 * Validate a game session's result by re-deriving from seeds.
 */
export async function validateGameSession(
  gameSessionId: string,
  recordedReels: GameSymbol[][],
  gameType: GameType
): Promise<IntegrityResult> {
  try {
    // Find the seed record for this game session
    const seed = await db.query.provablyFairSeeds.findFirst({
      where: and(
        eq(provablyFairSeeds.gameSessionId, gameSessionId),
        eq(provablyFairSeeds.revealed, true)
      ),
    });

    if (!seed) {
      return { valid: false, reason: "No revealed seed found for this session" };
    }

    // Verify the server seed matches its hash
    if (!verifyServerSeed(seed.serverSeed, seed.serverSeedHash)) {
      return {
        valid: false,
        reason: "Server seed does not match committed hash",
      };
    }

    // Re-derive the reel grid
    const { reels, rows } = getGameDimensions(gameType);
    const derivedGrid = deriveReelGrid(
      seed.serverSeed,
      seed.clientSeed,
      seed.nonce,
      reels,
      rows
    );

    // Compare grids
    const gridMatch = JSON.stringify(derivedGrid) === JSON.stringify(recordedReels);

    if (!gridMatch) {
      logger.error("Integrity validation failed — grid mismatch", {
        action: "integrityValidator",
        metadata: { gameSessionId, gameType },
      });
      return {
        valid: false,
        reason: "Derived reel grid does not match recorded result",
      };
    }

    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Integrity validation error", {
      action: "integrityValidator",
      metadata: { gameSessionId, error: message },
    });
    return { valid: false, reason: "Validation failed due to an error" };
  }
}

/**
 * Client-side verification helper — can verify a single spin result
 * using revealed server seed, client seed, and nonce.
 */
export function verifySpinLocally(
  serverSeed: string,
  serverSeedHash: string,
  clientSeed: string,
  nonce: number,
  expectedReels: GameSymbol[][],
  gameType: GameType
): IntegrityResult {
  // Verify seed commitment
  if (!verifyServerSeed(serverSeed, serverSeedHash)) {
    return {
      valid: false,
      reason: "Server seed does not match committed hash",
    };
  }

  const { reels, rows } = getGameDimensions(gameType);
  const derivedGrid = deriveReelGrid(
    serverSeed,
    clientSeed,
    nonce,
    reels,
    rows
  );

  const gridMatch =
    JSON.stringify(derivedGrid) === JSON.stringify(expectedReels);

  return gridMatch
    ? { valid: true }
    : {
        valid: false,
        reason: "Derived reel grid does not match recorded result",
      };
}
