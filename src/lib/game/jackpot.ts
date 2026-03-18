import { db } from "@/lib/db";
import { jackpot, wallets, transactions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { JackpotState } from "@/types";

const DEFAULT_JACKPOT_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Contribute a portion of a bet to the progressive jackpot.
 * Called after every real-money spin.
 * contributionRate = 0.005 (0.5% of bet)
 */
export async function contributeToJackpot(betAmount: number): Promise<void> {
  try {
    await db
      .update(jackpot)
      .set({
        currentAmount: sql`${jackpot.currentAmount} + (${betAmount.toString()} * ${jackpot.contributionRate})`,
        updatedAt: new Date(),
      })
      .where(eq(jackpot.id, DEFAULT_JACKPOT_ID));
  } catch (err) {
    // Non-critical — log but don't block the spin
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Jackpot contribution failed", {
      action: "jackpotContribute",
      metadata: { betAmount, error: message },
    });
  }
}

/**
 * Check if the jackpot is triggered on this spin.
 * Probability: ~1/50,000 (0.00002)
 * Uses crypto.getRandomValues for fairness.
 */
export function checkJackpotTrigger(): boolean {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const roll = array[0] / 0x100000000; // [0, 1)
  return roll < 0.00002; // 1/50,000
}

/**
 * Award the jackpot to a user. Atomic transaction:
 * 1. Read current jackpot amount
 * 2. Reset jackpot to seed value
 * 3. Credit user wallet
 * 4. Record transaction
 * 5. Update jackpot winner info
 *
 * Returns the awarded amount, or 0 if the award failed.
 */
export async function awardJackpot(userId: string): Promise<number> {
  try {
    // Read current jackpot
    const currentJackpot = await db.query.jackpot.findFirst({
      where: eq(jackpot.id, DEFAULT_JACKPOT_ID),
    });

    if (!currentJackpot) {
      logger.error("Jackpot record not found", { action: "awardJackpot" });
      return 0;
    }

    const amount = Number(currentJackpot.currentAmount);
    if (amount <= 0) {
      return 0;
    }

    // Reset jackpot to seed value and record winner atomically
    await db
      .update(jackpot)
      .set({
        currentAmount: "1000.00",
        lastWonBy: userId,
        lastWonAt: new Date(),
        lastWonAmount: amount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(jackpot.id, DEFAULT_JACKPOT_ID));

    // Credit user wallet
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record transaction
    await db.insert(transactions).values({
      userId,
      type: "jackpot",
      amount: amount.toString(),
      metadata: {
        jackpotId: DEFAULT_JACKPOT_ID,
        type: "jackpot_win",
      },
    });

    logger.info("Jackpot awarded!", {
      action: "awardJackpot",
      metadata: { userId, amount },
    });

    return amount;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Jackpot award failed", {
      action: "awardJackpot",
      metadata: { userId, error: message },
    });
    return 0;
  }
}

/**
 * Get current jackpot state for display / polling.
 */
export async function getJackpotState(): Promise<JackpotState | null> {
  try {
    const record = await db.query.jackpot.findFirst({
      where: eq(jackpot.id, DEFAULT_JACKPOT_ID),
    });

    if (!record) return null;

    return {
      id: record.id,
      name: record.name,
      currentAmount: Number(record.currentAmount),
      lastWonAt: record.lastWonAt,
      lastWonAmount: record.lastWonAmount ? Number(record.lastWonAmount) : null,
    };
  } catch {
    return null;
  }
}
