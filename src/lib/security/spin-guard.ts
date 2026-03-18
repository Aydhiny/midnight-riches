import { db } from "@/lib/db";
import { selfExclusions, gamblingLimits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { SpinGuardResult } from "@/types";

// In-memory last-spin tracker for interval enforcement
const lastSpinTime = new Map<string, number>();
const activeSpins = new Set<string>();

const MIN_SPIN_INTERVAL_MS = 500; // Minimum 500ms between spins

/**
 * Spin Guard — checks performed BEFORE every spin is processed.
 * Order: self-exclusion → gambling limits → interval → parallel spin → denomination
 */
export async function checkSpinGuard(
  userId: string,
  betAmount: number,
  betPerLine: number,
  validDenominations: number[]
): Promise<SpinGuardResult> {
  // 1. Self-exclusion check (FIRST — hard requirement)
  const exclusion = await db.query.selfExclusions.findFirst({
    where: and(
      eq(selfExclusions.userId, userId),
      eq(selfExclusions.isActive, true)
    ),
  });

  if (exclusion) {
    logger.warn("Self-excluded user attempted spin", {
      action: "spinGuard",
      metadata: { userId, exclusionType: exclusion.exclusionType },
    });
    return {
      allowed: false,
      reason: "Account is self-excluded from gambling",
      event: {
        eventType: "self_exclusion_attempt",
        severity: "high",
        details: {
          exclusionType: exclusion.exclusionType,
          exclusionId: exclusion.id,
        },
      },
    };
  }

  // 2. Gambling limits check (loss limits)
  const lossLimits = await db.query.gamblingLimits.findMany({
    where: and(
      eq(gamblingLimits.userId, userId),
      eq(gamblingLimits.isActive, true)
    ),
  });

  for (const limit of lossLimits) {
    if (limit.limitType === "loss") {
      const usage = Number(limit.currentUsage);
      const max = Number(limit.limitValue);
      if (usage + betAmount > max) {
        return {
          allowed: false,
          reason: `Loss limit would be exceeded (${usage.toFixed(2)}/${max.toFixed(2)})`,
          event: {
            eventType: "suspicious_pattern",
            severity: "low",
            details: { limitType: "loss", usage, max, betAmount },
          },
        };
      }
    }
  }

  // 3. Interval enforcement (minimum time between spins)
  const now = Date.now();
  const lastSpin = lastSpinTime.get(userId);
  if (lastSpin && now - lastSpin < MIN_SPIN_INTERVAL_MS) {
    return {
      allowed: false,
      reason: "Spinning too fast",
      event: {
        eventType: "rate_limit_exceeded",
        severity: "low",
        details: {
          timeSinceLastSpin: now - lastSpin,
          minInterval: MIN_SPIN_INTERVAL_MS,
        },
      },
    };
  }

  // 4. Parallel spin prevention
  if (activeSpins.has(userId)) {
    return {
      allowed: false,
      reason: "A spin is already in progress",
      event: {
        eventType: "suspicious_pattern",
        severity: "medium",
        details: { type: "parallel_spin_attempt" },
      },
    };
  }

  // 5. Denomination validation
  if (!validDenominations.includes(betPerLine)) {
    return {
      allowed: false,
      reason: "Invalid bet denomination",
      event: {
        eventType: "integrity_failure",
        severity: "high",
        details: {
          betPerLine,
          validDenominations,
        },
      },
    };
  }

  // All checks passed — mark spin as active
  activeSpins.add(userId);
  lastSpinTime.set(userId, now);

  return { allowed: true };
}

/**
 * Release the active spin lock for a user. Must be called after spin completes.
 */
export function releaseSpinLock(userId: string): void {
  activeSpins.delete(userId);
}

/**
 * Check if a user is currently self-excluded. Standalone check for use
 * outside the spin flow (e.g., blocking deposits during exclusion).
 */
export async function isUserExcluded(userId: string): Promise<boolean> {
  const exclusion = await db.query.selfExclusions.findFirst({
    where: and(
      eq(selfExclusions.userId, userId),
      eq(selfExclusions.isActive, true)
    ),
  });
  return !!exclusion;
}
