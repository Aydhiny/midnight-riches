import { db } from "@/lib/db";
import { wallets, transactions } from "@/lib/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function getWallet(userId: string) {
  return db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });
}

export async function getTransactions(
  userId: string,
  opts: { limit?: number; offset?: number; type?: string; dateFrom?: Date; dateTo?: Date } = {}
) {
  const conditions = [eq(transactions.userId, userId)];

  if (opts.type) {
    conditions.push(
      eq(transactions.type, opts.type as "deposit" | "withdrawal" | "bet" | "win" | "bonus")
    );
  }
  if (opts.dateFrom) {
    conditions.push(gte(transactions.createdAt, opts.dateFrom));
  }
  if (opts.dateTo) {
    conditions.push(lte(transactions.createdAt, opts.dateTo));
  }

  return db.query.transactions.findMany({
    where: and(...conditions),
    orderBy: [desc(transactions.createdAt)],
    limit: opts.limit ?? 20,
    offset: opts.offset ?? 0,
  });
}
