"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions, gameSessions, bonusRounds } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { executeSpin, NUM_PAYLINES } from "@/lib/game";
import { spinRequestSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/server/rate-limiter";
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

export async function spinAction(formData: { betPerLine: number; bonus: BonusState }): Promise<SpinResponse> {
  const start = performance.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = checkRateLimit(`spin:${userId}`, { maxRequests: 30, windowMs: 60_000 });
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

    if (!isBonusSpin) {
      const [updated] = await db
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
        .returning();

      if (!updated) {
        return { success: false, error: "Insufficient balance", code: "INSUFFICIENT_FUNDS" };
      }

      await db.insert(transactions).values({
        userId,
        type: "bet",
        amount: (-totalBet).toString(),
        metadata: { betPerLine, paylines: NUM_PAYLINES },
      });
    }

    const { result, newBonus } = executeSpin(betPerLine, formData.bonus);

    if (result.totalWin > 0) {
      await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${result.totalWin.toString()}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      await db.insert(transactions).values({
        userId,
        type: isBonusSpin ? "bonus" : "win",
        amount: result.totalWin.toString(),
        metadata: { reels: result.reels, paylines: result.paylines },
      });
    }

    const outcome = result.totalWin > 0 ? "win" : result.bonusTriggered ? "bonus" : "loss";

    const [gameSession] = await db
      .insert(gameSessions)
      .values({
        userId,
        betAmount: totalBet.toString(),
        outcome,
        winAmount: result.totalWin.toString(),
        reelResult: result.reels,
      })
      .returning();

    if (result.bonusTriggered && gameSession) {
      await db.insert(bonusRounds).values({
        userId,
        gameSessionId: gameSession.id,
        type: "free_spins",
        spinsRemaining: newBonus.spinsRemaining,
        multiplier: newBonus.multiplier.toString(),
        isActive: true,
      });
    }

    const updatedWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    const duration = Math.round(performance.now() - start);
    logger.gameOutcome(userId, totalBet, result.totalWin, {
      outcome,
      bonusTriggered: result.bonusTriggered,
      duration,
    });

    return {
      success: true,
      result,
      bonus: newBonus,
      balance: Number(updatedWallet?.balance ?? 0),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Spin action failed", { action: "spin", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
