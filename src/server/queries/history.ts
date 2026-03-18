import { db } from "@/lib/db";
import { gameSessions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import type { HistoryFilter } from "@/lib/validators";

export async function getGameHistory(userId: string, filter: HistoryFilter) {
  const conditions = [eq(gameSessions.userId, userId)];

  if (filter.outcome) {
    conditions.push(eq(gameSessions.outcome, filter.outcome));
  }
  if (filter.dateFrom) {
    conditions.push(gte(gameSessions.createdAt, new Date(filter.dateFrom)));
  }
  if (filter.dateTo) {
    conditions.push(lte(gameSessions.createdAt, new Date(filter.dateTo)));
  }

  const offset = (filter.page - 1) * filter.limit;

  const [items, countResult] = await Promise.all([
    db.query.gameSessions.findMany({
      where: and(...conditions),
      orderBy: [desc(gameSessions.createdAt)],
      limit: filter.limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(gameSessions)
      .where(and(...conditions)),
  ]);

  return {
    items,
    total: Number(countResult[0]?.count ?? 0),
    page: filter.page,
    totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / filter.limit),
  };
}
