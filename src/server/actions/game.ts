"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions, gameSessions, bonusRounds } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { getEngine } from "@/lib/game/engines";
import { gameSpinSchema, bonusClaimSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { checkSpinGuard, releaseSpinLock, recordSecurityEvent } from "@/lib/security";
import { contributeToJackpot, checkJackpotTrigger, awardJackpot } from "@/lib/game/jackpot";
import type { GameType, BonusState, SpinResult } from "@/types";

interface SpinActionSuccess {
  success: true;
  result: SpinResult;
  bonus: BonusState;
  balance: number;
  jackpotWin?: number;
}

interface SpinActionError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "VALIDATION_ERROR" | "INSUFFICIENT_FUNDS" | "NOT_FOUND" | "BLOCKED" | "INTERNAL_ERROR";
}

type SpinActionResult = SpinActionSuccess | SpinActionError;

interface BonusSpinSuccess {
  success: true;
  result: SpinResult;
  bonus: BonusState;
  balance: number;
}

type BonusSpinResult = BonusSpinSuccess | SpinActionError;

export async function gameSpinAction(input: {
  gameType: GameType;
  betAmount: number;
  betPerLine: number;
  bonus: BonusState;
}): Promise<SpinActionResult> {
  const start = performance.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = checkRateLimit(`game-spin:${userId}`, { maxRequests: 10, windowMs: 5_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = gameSpinSchema.safeParse({
      gameType: input.gameType,
      betAmount: input.betAmount,
      betPerLine: input.betPerLine,
    });
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
    }

    const { gameType, betAmount, betPerLine } = parsed.data;
    const isBonusSpin = input.bonus.isActive;
    const engine = getEngine(gameType);

    // Anti-cheat: spin guard (self-exclusion, limits, interval, parallel, denomination)
    const guardResult = await checkSpinGuard(
      userId,
      betAmount,
      betPerLine,
      engine.config.denominations
    );

    if (!guardResult.allowed) {
      if (guardResult.event) {
        await recordSecurityEvent(userId, guardResult.event);
      }
      return {
        success: false,
        error: guardResult.reason || "Spin blocked",
        code: "BLOCKED",
      };
    }

    try {
    if (!isBonusSpin) {
      const [updated] = await db
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} - ${betAmount.toString()}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(wallets.userId, userId),
            gte(wallets.balance, betAmount.toString())
          )
        )
        .returning();

      if (!updated) {
        return { success: false, error: "Insufficient balance", code: "INSUFFICIENT_FUNDS" };
      }

      await db.insert(transactions).values({
        userId,
        type: "bet",
        amount: (-betAmount).toString(),
        metadata: { gameType, betPerLine, betAmount },
      });
    }

    const result = engine.spin({
      betPerLine,
      betAmount,
      bonus: input.bonus,
    });

    const bonusResult = engine.triggerBonus(result.reels, input.bonus);
    let newBonus = bonusResult.newState;

    if (result.bonusTriggered && !input.bonus.isActive) {
      newBonus = {
        isActive: true,
        spinsRemaining: engine.config.bonusFreeSpins,
        multiplier: engine.config.bonusMultiplier,
        totalBonusWin: 0,
      };
    } else if (input.bonus.isActive) {
      const remaining = input.bonus.spinsRemaining - 1;
      newBonus = {
        isActive: remaining > 0,
        spinsRemaining: remaining,
        multiplier: remaining > 0 ? input.bonus.multiplier : 1,
        totalBonusWin: input.bonus.totalBonusWin + result.totalWin,
      };
    }

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
        metadata: { gameType, reels: result.reels },
      });
    }

    const outcome = result.totalWin > 0 ? "win" : result.bonusTriggered ? "bonus" : "loss";

    const [gameSession] = await db
      .insert(gameSessions)
      .values({
        userId,
        gameId: gameType,
        betAmount: betAmount.toString(),
        outcome,
        winAmount: result.totalWin.toString(),
        reelResult: result.reels,
      })
      .returning();

    if (result.bonusTriggered && gameSession && !input.bonus.isActive) {
      await db.insert(bonusRounds).values({
        userId,
        gameSessionId: gameSession.id,
        type: "free_spins",
        spinsRemaining: newBonus.spinsRemaining,
        multiplier: newBonus.multiplier.toString(),
        isActive: true,
      });
    }

    // Progressive jackpot: contribute + check trigger (real-money spins only)
    let jackpotWin: number | undefined;
    if (!isBonusSpin) {
      await contributeToJackpot(betAmount);

      if (checkJackpotTrigger()) {
        jackpotWin = await awardJackpot(userId);
        if (jackpotWin > 0) {
          logger.info("JACKPOT WON!", {
            action: "game-spin",
            metadata: { userId, jackpotWin },
          });
        }
      }
    }

    const updatedWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    const duration = Math.round(performance.now() - start);
    logger.gameOutcome(userId, betAmount, result.totalWin, {
      outcome,
      gameType,
      bonusTriggered: result.bonusTriggered,
      jackpotWin,
      duration,
    });

    return {
      success: true,
      result,
      bonus: newBonus,
      balance: Number(updatedWallet?.balance ?? 0),
      jackpotWin,
    };
    } finally {
      releaseSpinLock(userId);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Game spin action failed", { action: "game-spin", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function claimBonusSpinAction(input: {
  bonusRoundId: string;
  gameType: GameType;
  betPerLine: number;
  betAmount: number;
}): Promise<BonusSpinResult> {
  const start = performance.now();

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const parsed = bonusClaimSchema.safeParse({ bonusRoundId: input.bonusRoundId });
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
    }

    const bonusRound = await db.query.bonusRounds.findFirst({
      where: and(
        eq(bonusRounds.id, parsed.data.bonusRoundId),
        eq(bonusRounds.userId, userId),
        eq(bonusRounds.isActive, true)
      ),
    });

    if (!bonusRound) {
      return { success: false, error: "Bonus round not found", code: "NOT_FOUND" };
    }

    const engine = getEngine(input.gameType);
    const bonusState: BonusState = {
      isActive: true,
      spinsRemaining: bonusRound.spinsRemaining,
      multiplier: Number(bonusRound.multiplier),
      totalBonusWin: 0,
    };

    const result = engine.spin({
      betPerLine: input.betPerLine,
      betAmount: input.betAmount,
      bonus: bonusState,
    });

    const remaining = bonusRound.spinsRemaining - 1;
    const isComplete = remaining <= 0;

    await db
      .update(bonusRounds)
      .set({
        spinsRemaining: remaining,
        isActive: !isComplete,
      })
      .where(eq(bonusRounds.id, bonusRound.id));

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
        type: "bonus",
        amount: result.totalWin.toString(),
        metadata: { gameType: input.gameType, bonusRoundId: bonusRound.id },
      });
    }

    await db.insert(gameSessions).values({
      userId,
      gameId: input.gameType,
      betAmount: "0",
      outcome: result.totalWin > 0 ? "win" : "loss",
      winAmount: result.totalWin.toString(),
      reelResult: result.reels,
    });

    const updatedWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    const newBonus: BonusState = {
      isActive: !isComplete,
      spinsRemaining: remaining,
      multiplier: isComplete ? 1 : Number(bonusRound.multiplier),
      totalBonusWin: result.totalWin,
    };

    const duration = Math.round(performance.now() - start);
    logger.gameOutcome(userId, 0, result.totalWin, {
      outcome: "bonus",
      bonusSpin: true,
      remaining,
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
    logger.error("Bonus spin action failed", { action: "bonus-spin", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
