"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { gamblingLimits, selfExclusions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { setGamblingLimitSchema, selfExcludeSchema } from "@/lib/validators";
import type { ActionResult } from "@/lib/server/action-wrapper";
import type { GamblingLimit, SelfExclusion } from "@/types";

export async function setGamblingLimit(input: {
  limitType: "deposit" | "loss" | "session";
  limitValue: number;
  periodDays: number;
}): Promise<ActionResult<GamblingLimit>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = checkRateLimit(`gambling-limit:${userId}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = setGamblingLimitSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
    }

    const { limitType, limitValue, periodDays } = parsed.data;

    // Deactivate existing limit of same type
    await db
      .update(gamblingLimits)
      .set({ isActive: false })
      .where(
        and(
          eq(gamblingLimits.userId, userId),
          eq(gamblingLimits.limitType, limitType),
          eq(gamblingLimits.isActive, true)
        )
      );

    // Create new limit
    const periodResetAt = new Date();
    periodResetAt.setDate(periodResetAt.getDate() + periodDays);

    const [newLimit] = await db
      .insert(gamblingLimits)
      .values({
        userId,
        limitType,
        limitValue: limitValue.toString(),
        periodDays,
        currentUsage: "0.00",
        periodResetAt,
        isActive: true,
      })
      .returning();

    logger.action("setGamblingLimit", userId, 0, {
      limitType,
      limitValue,
      periodDays,
    });

    return {
      success: true,
      data: {
        limitType: newLimit.limitType as "deposit" | "loss" | "session",
        limitValue: Number(newLimit.limitValue),
        periodDays: newLimit.periodDays,
        currentUsage: Number(newLimit.currentUsage),
        periodResetAt: newLimit.periodResetAt,
        isActive: newLimit.isActive,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Set gambling limit failed", {
      action: "setGamblingLimit",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function getGamblingLimits(): Promise<ActionResult<GamblingLimit[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const limits = await db.query.gamblingLimits.findMany({
      where: and(
        eq(gamblingLimits.userId, session.user.id),
        eq(gamblingLimits.isActive, true)
      ),
    });

    return {
      success: true,
      data: limits.map((l) => ({
        limitType: l.limitType as "deposit" | "loss" | "session",
        limitValue: Number(l.limitValue),
        periodDays: l.periodDays,
        currentUsage: Number(l.currentUsage),
        periodResetAt: l.periodResetAt,
        isActive: l.isActive,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Get gambling limits failed", {
      action: "getGamblingLimits",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function selfExclude(input: {
  exclusionType: "temporary" | "permanent";
  durationDays?: number;
  reason?: string;
}): Promise<ActionResult<SelfExclusion>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const parsed = selfExcludeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
    }

    const { exclusionType, durationDays, reason } = parsed.data;

    let endDate: Date | null = null;
    if (exclusionType === "temporary" && durationDays) {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
    }

    const [exclusion] = await db
      .insert(selfExclusions)
      .values({
        userId,
        exclusionType,
        endDate,
        reason: reason || null,
        isActive: true,
      })
      .returning();

    logger.action("selfExclude", userId, 0, {
      exclusionType,
      durationDays,
    });

    return {
      success: true,
      data: {
        exclusionType: exclusion.exclusionType as "temporary" | "permanent",
        startDate: exclusion.startDate,
        endDate: exclusion.endDate,
        reason: exclusion.reason,
        isActive: exclusion.isActive,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Self-exclude failed", {
      action: "selfExclude",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function getExclusionStatus(): Promise<
  ActionResult<SelfExclusion | null>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const exclusion = await db.query.selfExclusions.findFirst({
      where: and(
        eq(selfExclusions.userId, session.user.id),
        eq(selfExclusions.isActive, true)
      ),
    });

    if (!exclusion) {
      return { success: true, data: null };
    }

    return {
      success: true,
      data: {
        exclusionType: exclusion.exclusionType as "temporary" | "permanent",
        startDate: exclusion.startDate,
        endDate: exclusion.endDate,
        reason: exclusion.reason,
        isActive: exclusion.isActive,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Get exclusion status failed", {
      action: "getExclusionStatus",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
