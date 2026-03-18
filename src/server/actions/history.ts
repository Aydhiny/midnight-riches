"use server";

import { auth } from "@/lib/auth";
import { getGameHistory } from "@/server/queries/history";
import { historyFilterSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";

export async function getHistoryAction(filter: {
  page?: number;
  limit?: number;
  outcome?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false as const, error: "Unauthorized", code: "UNAUTHORIZED" as const };
    }

    const rateLimitResult = checkRateLimit(`history:${session.user.id}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rateLimitResult.success) {
      return { success: false as const, error: "Too many requests", code: "RATE_LIMITED" as const };
    }

    const parsed = historyFilterSchema.safeParse({
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      outcome: filter.outcome,
      dateFrom: filter.dateFrom,
      dateTo: filter.dateTo,
    });

    if (!parsed.success) {
      return { success: false as const, error: "Invalid filter", code: "VALIDATION_ERROR" as const };
    }

    const data = await getGameHistory(session.user.id, parsed.data);
    return { success: true as const, ...data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("History fetch failed", { action: "history", metadata: { error: message } });
    return { success: false as const, error: "Internal error", code: "INTERNAL_ERROR" as const };
  }
}
