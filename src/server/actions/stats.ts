"use server";

import { auth } from "@/lib/auth";
import { getGameStats, getRtpHistory } from "@/server/queries/stats";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { userAchievements } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function getStatsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized", code: "UNAUTHORIZED" as const };
    }

    const rateLimitResult = checkRateLimit(`stats:${session.user.id}`, { maxRequests: 20, windowMs: 60_000 });
    if (!rateLimitResult.success) {
      return { success: false as const, error: "Too many requests", code: "RATE_LIMITED" as const };
    }

    const stats = await getGameStats(session.user.id);
    return { success: true as const, stats };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Stats fetch failed", { action: "stats", metadata: { error: message } });
    return { success: false as const, error: "Internal error", code: "INTERNAL_ERROR" as const };
  }
}

export async function getPlayerStatsAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized", code: "UNAUTHORIZED" as const };
    }
    const userId = session.user.id;

    const rateLimitResult = checkRateLimit(`playerStats:${userId}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rateLimitResult.success) {
      return { success: false as const, error: "Too many requests", code: "RATE_LIMITED" as const };
    }

    const [gameStats, [achievementCount]] = await Promise.all([
      getGameStats(userId),
      db.select({ total: count() }).from(userAchievements).where(eq(userAchievements.userId, userId)),
    ]);

    return {
      success: true as const,
      data: {
        totalSpins: gameStats.totalSpins,
        totalWon: gameStats.totalWon,
        achievements: achievementCount?.total ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Player stats fetch failed", { action: "playerStats", metadata: { error: message } });
    return { success: false as const, error: "Internal error", code: "INTERNAL_ERROR" as const };
  }
}

export async function getRtpHistoryAction() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized", code: "UNAUTHORIZED" as const };
    }

    const data = await getRtpHistory(session.user.id);
    return { success: true as const, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("RTP history fetch failed", { action: "rtp-history", metadata: { error: message } });
    return { success: false as const, error: "Internal error", code: "INTERNAL_ERROR" as const };
  }
}
