"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions, gameSessions, bonusRounds } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { executeSpin, NUM_PAYLINES } from "@/lib/game";
import { spinRequestSchema } from "@/lib/validators";
import { checkRateLimitAsync } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import type { BonusState, SpinResult } from "@/types";

interface SpinSuccess {
  success: true;
  result: SpinResult;
  bonus: BonusState;
  balance: number;
}

interface SpinError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "VALIDATION_ERROR" | "NOT_FOUND" | "INSUFFICIENT_FUNDS" | "INTERNAL_ERROR";
}

type SpinResponse = SpinSuccess | SpinError;

// Internal error sentinel for signalling specific failures from within a transaction
class SpinTxError extends Error {
  constructor(public readonly code: SpinError["code"], message: string) {
    super(message);
    this.name = "SpinTxError";
  }
}

export async function spinAction(formData: { betPerLine: number; bonus: BonusState }): Promise<SpinResponse> {
  const start = performance.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = await checkRateLimitAsync(`spin:${userId}`, { maxRequests: 30, windowMs: 60_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = spinRequestSchema.safeParse({ betPerLine: formData.betPerLine });
    if (!parsed.success) {
      return { success: false, error: "Invalid bet amount", code: "VALIDATION_ERROR" };
    }

    const { betPerLine } = parsed.data;
    const totalBet = betPerLine * NUM_PAYLINES;
    const isBonusSpin = formData.bonus.isActive;

    // Compute spin result BEFORE the transaction so no async work happens mid-tx
    const { result, newBonus } = executeSpin(betPerLine, formData.bonus);
    const outcome = result.totalWin > 0 ? "win" : result.bonusTriggered ? "bonus" : "loss";

    // ── Atomic transaction: deduct bet → credit win → record session ──────────
    const { balance } = await db.transaction(async (tx) => {
      // 1. Deduct bet (only for non-bonus spins), checking balance atomically
      if (!isBonusSpin) {
        const [updated] = await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} - ${totalBet.toString()}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(wallets.userId, userId),
              gte(wallets.balance, totalBet.toString())
            )
          )
          .returning({ balance: wallets.balance });

        if (!updated) {
          throw new SpinTxError("INSUFFICIENT_FUNDS", "Insufficient balance");
        }

        // 2. Record the bet transaction
        await tx.insert(transactions).values({
          userId,
          type: "bet",
          amount: (-totalBet).toString(),
          metadata: { betPerLine, paylines: NUM_PAYLINES },
        });
      }

      // 3. Credit winnings (if any)
      if (result.totalWin > 0) {
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${result.totalWin.toString()}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, userId));

        // 4. Record the win transaction
        await tx.insert(transactions).values({
          userId,
          type: isBonusSpin ? "bonus" : "win",
          amount: result.totalWin.toString(),
          metadata: { reels: result.reels, paylines: result.paylines },
        });
      }

      // 5. Insert game session record
      const [gameSession] = await tx
        .insert(gameSessions)
        .values({
          userId,
          betAmount: totalBet.toString(),
          outcome,
          winAmount: result.totalWin.toString(),
          reelResult: result.reels,
        })
        .returning({ id: gameSessions.id });

      // 6. Insert bonus round trigger if applicable
      if (result.bonusTriggered && gameSession) {
        await tx.insert(bonusRounds).values({
          userId,
          gameSessionId: gameSession.id,
          type: "free_spins",
          spinsRemaining: newBonus.spinsRemaining,
          multiplier: newBonus.multiplier.toString(),
          isActive: true,
        });
      }

      // 7. Fetch final balance within the same transaction
      const [finalWallet] = await tx
        .select({ balance: wallets.balance })
        .from(wallets)
        .where(eq(wallets.userId, userId));

      return { balance: Number(finalWallet?.balance ?? 0) };
    });

    const duration = Math.round(performance.now() - start);
    logger.gameOutcome(userId, totalBet, result.totalWin, {
      outcome,
      bonusTriggered: result.bonusTriggered,
      duration,
    });

    return { success: true, result, bonus: newBonus, balance };
  } catch (err) {
    // Surface domain errors with the correct code
    if (err instanceof SpinTxError) {
      return { success: false, error: err.message, code: err.code };
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Spin action failed", { action: "spin", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
