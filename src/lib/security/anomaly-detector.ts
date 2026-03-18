import { db } from "@/lib/db";
import { gameSessions, securityEvents } from "@/lib/db/schema";
import { eq, gte, and, count } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { AnomalyFlag, SecurityEvent } from "@/types";

interface AnomalyCheckResult {
  flagged: boolean;
  flags: AnomalyFlag[];
}

// Thresholds
const WIN_RATE_THRESHOLD = 0.65; // Flag if >65% win rate over last 100 spins
const PAYOUT_RATIO_THRESHOLD = 3.0; // Flag if payout/bet ratio >3x over window
const FREQUENCY_THRESHOLD = 200; // Flag if >200 spins in last hour
const WINDOW_SPINS = 100;

/**
 * Analyze recent play patterns for a user and detect anomalies.
 * Returns flags but does NOT block — the caller decides what to do.
 */
export async function detectAnomalies(
  userId: string
): Promise<AnomalyCheckResult> {
  const flags: AnomalyFlag[] = [];

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Get recent game sessions
    const recentSessions = await db.query.gameSessions.findMany({
      where: and(
        eq(gameSessions.userId, userId),
        gte(gameSessions.createdAt, oneHourAgo)
      ),
      orderBy: (gs, { desc }) => [desc(gs.createdAt)],
      limit: WINDOW_SPINS,
    });

    if (recentSessions.length < 10) {
      // Not enough data to analyze
      return { flagged: false, flags: [] };
    }

    // 1. Win rate check
    const wins = recentSessions.filter((s) => s.outcome === "win").length;
    const winRate = wins / recentSessions.length;
    if (winRate > WIN_RATE_THRESHOLD) {
      flags.push({
        type: "win_rate",
        value: winRate,
        threshold: WIN_RATE_THRESHOLD,
        description: `Win rate ${(winRate * 100).toFixed(1)}% exceeds threshold of ${(WIN_RATE_THRESHOLD * 100).toFixed(0)}%`,
      });
    }

    // 2. Payout ratio check
    const totalBets = recentSessions.reduce(
      (sum, s) => sum + Number(s.betAmount),
      0
    );
    const totalWins = recentSessions.reduce(
      (sum, s) => sum + Number(s.winAmount),
      0
    );
    const payoutRatio = totalBets > 0 ? totalWins / totalBets : 0;
    if (payoutRatio > PAYOUT_RATIO_THRESHOLD) {
      flags.push({
        type: "payout_ratio",
        value: payoutRatio,
        threshold: PAYOUT_RATIO_THRESHOLD,
        description: `Payout ratio ${payoutRatio.toFixed(2)}x exceeds threshold of ${PAYOUT_RATIO_THRESHOLD}x`,
      });
    }

    // 3. Frequency check
    const [frequencyResult] = await db
      .select({ total: count() })
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.userId, userId),
          gte(gameSessions.createdAt, oneHourAgo)
        )
      );

    const spinCount = frequencyResult?.total ?? 0;
    if (spinCount > FREQUENCY_THRESHOLD) {
      flags.push({
        type: "frequency",
        value: spinCount,
        threshold: FREQUENCY_THRESHOLD,
        description: `${spinCount} spins in last hour exceeds threshold of ${FREQUENCY_THRESHOLD}`,
      });
    }

    const flagged = flags.length > 0;

    if (flagged) {
      // Record a security event
      const severity =
        flags.length >= 3 ? "critical" : flags.length >= 2 ? "high" : "medium";

      await db.insert(securityEvents).values({
        userId,
        eventType: "anomaly_detected",
        severity,
        details: { flags },
      });

      logger.warn("Anomaly detected", {
        action: "anomalyDetector",
        metadata: { userId, flags: flags.length, severity },
      });
    }

    return { flagged, flags };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Anomaly detection failed", {
      action: "anomalyDetector",
      metadata: { userId, error: message },
    });
    // Don't block the spin on detection failure
    return { flagged: false, flags: [] };
  }
}

/**
 * Record a security event manually (for use by other systems).
 */
export async function recordSecurityEvent(
  userId: string,
  event: SecurityEvent
): Promise<void> {
  try {
    await db.insert(securityEvents).values({
      userId,
      eventType: event.eventType,
      severity: event.severity,
      details: event.details,
      ipAddress: event.ipAddress,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to record security event", {
      action: "recordSecurityEvent",
      metadata: { userId, error: message },
    });
  }
}
