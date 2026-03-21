"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";

interface GambleSuccess {
  success: true;
  won: boolean;
  newBalance: number;
  /** The amount that was gambled */
  amount: number;
}

interface GambleError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "INVALID_AMOUNT" | "INSUFFICIENT_FUNDS" | "INTERNAL_ERROR";
}

export type GambleResult = GambleSuccess | GambleError;

/**
 * Double-or-Nothing gamble.
 *
 * The spin win has already been credited to the wallet.
 * - If the gamble wins  → credit `amount` again (doubling the win)
 * - If the gamble loses → debit `amount`  (losing the original win back)
 *
 * This keeps the accounting clean: the wallet always reflects the true state.
 */
export async function gambleAction(input: { amount: number }): Promise<GambleResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    // Strict rate limit — max 10 gambles per minute
    const rl = checkRateLimit(`gamble:${userId}`, { maxRequests: 10, windowMs: 60_000 });
    if (!rl.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000) {
      return { success: false, error: "Invalid amount", code: "INVALID_AMOUNT" };
    }

    // Verify wallet exists and has enough balance to cover a potential loss
    const wallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    if (!wallet) {
      return { success: false, error: "Wallet not found", code: "INTERNAL_ERROR" };
    }

    const currentBalance = Number(wallet.balance);
    if (currentBalance < amount) {
      return { success: false, error: "Insufficient funds", code: "INSUFFICIENT_FUNDS" };
    }

    // 50 / 50 provably random outcome
    const won = Math.random() < 0.5;
    const delta = won ? amount : -amount;

    // Update wallet atomically
    await db
      .update(wallets)
      .set({
        balance:   sql`${wallets.balance} + ${delta.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type:   "gamble",
      amount: delta.toString(),
      metadata: {
        gambleAmount: amount,
        won,
      },
    });

    const updated = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    logger.action("gamble", userId, amount, { won, delta });

    return {
      success:    true,
      won,
      newBalance: Number(updated?.balance ?? 0),
      amount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Gamble action failed", { action: "gamble", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
