"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { depositSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";

interface WalletSuccess {
  success: true;
  balance: number;
  currency?: string;
}

interface WalletError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
}

type WalletResponse = WalletSuccess | WalletError;

export async function depositAction(data: { amount: number }): Promise<WalletResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = checkRateLimit(`deposit:${userId}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = depositSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid amount", code: "VALIDATION_ERROR" };
    }

    const { amount } = parsed.data;

    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    await db.insert(transactions).values({
      userId,
      type: "deposit",
      amount: amount.toString(),
      metadata: { method: "mock" },
    });

    const updated = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    logger.action("deposit", userId, 0, { amount });

    return { success: true, balance: Number(updated?.balance ?? 0) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Deposit failed", { action: "deposit", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function getWalletAction(): Promise<WalletResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, session.user.id),
    });

    if (!wallet) {
      return { success: false, error: "Wallet not found", code: "NOT_FOUND" };
    }

    return {
      success: true,
      balance: Number(wallet.balance),
      currency: wallet.currency,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Get wallet failed", { action: "getWallet", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
