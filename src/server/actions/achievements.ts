"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { userAchievements, dailyChallengeProgress, gameSessions } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { ACHIEVEMENTS, type Achievement } from "@/lib/game/achievements";
import { getDailyChallenges } from "@/lib/game/daily-challenges";

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function checkAchievementsAction(result: {
  totalWin: number;
  betAmount: number;
  bonusTriggered: boolean;
  jackpotWin?: number;
  gameType: string;
}): Promise<{ newAchievements: Achievement[] }> {
  const session = await auth();
  if (!session?.user?.id) return { newAchievements: [] };
  const userId = session.user.id;

  // Get already unlocked achievements
  const existing = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, userId),
  });
  const unlockedIds = new Set(existing.map(a => a.achievementId));

  const toUnlock: string[] = [];

  // first_spin: always unlock on first call if not already
  if (!unlockedIds.has("first_spin")) toUnlock.push("first_spin");

  // first_win
  if (!unlockedIds.has("first_win") && result.totalWin > 0) toUnlock.push("first_win");

  // big_win: win 10x bet
  if (!unlockedIds.has("big_win") && result.totalWin >= result.betAmount * 10) toUnlock.push("big_win");

  // mega_win: win 50x bet
  if (!unlockedIds.has("mega_win") && result.totalWin >= result.betAmount * 50) toUnlock.push("mega_win");

  // bonus_triggered
  if (!unlockedIds.has("bonus_triggered") && result.bonusTriggered) toUnlock.push("bonus_triggered");

  // jackpot
  if (!unlockedIds.has("jackpot") && result.jackpotWin && result.jackpotWin > 0) toUnlock.push("jackpot");

  // classic_master: 50 spins on classic
  if (!unlockedIds.has("classic_master") && result.gameType === "classic") {
    const [{ value }] = await db
      .select({ value: count() })
      .from(gameSessions)
      .where(and(eq(gameSessions.userId, userId), eq(gameSessions.gameId, "classic")));
    if (Number(value) >= 50) toUnlock.push("classic_master");
  }

  if (toUnlock.length === 0) return { newAchievements: [] };

  // Insert new achievements (ignore duplicates gracefully)
  await db.insert(userAchievements).values(
    toUnlock.map(id => ({ userId, achievementId: id }))
  ).onConflictDoNothing();

  const newAchievements = ACHIEVEMENTS.filter(a => toUnlock.includes(a.id));
  return { newAchievements };
}

export async function getUserAchievementsAction(): Promise<{
  unlocked: string[];
  total: number;
}> {
  const session = await auth();
  if (!session?.user?.id) return { unlocked: [], total: ACHIEVEMENTS.length };
  const userId = session.user.id;

  const existing = await db.query.userAchievements.findMany({
    where: eq(userAchievements.userId, userId),
  });

  return {
    unlocked: existing.map(a => a.achievementId),
    total: ACHIEVEMENTS.length,
  };
}

export async function getDailyChallengesProgressAction(): Promise<{
  challenges: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    target: number;
    rewardXp: number;
    rewardCredits: number;
    progress: number;
    completed: boolean;
  }>;
}> {
  const session = await auth();
  if (!session?.user?.id) return { challenges: [] };
  const userId = session.user.id;

  const dateStr = today();
  const todayChallenges = getDailyChallenges(dateStr);

  const progressRows = await db.query.dailyChallengeProgress.findMany({
    where: and(
      eq(dailyChallengeProgress.userId, userId),
      eq(dailyChallengeProgress.date, dateStr)
    ),
  });

  const progressMap = new Map(progressRows.map(p => [p.challengeId, p]));

  return {
    challenges: todayChallenges.map(c => {
      const prog = progressMap.get(c.id);
      return {
        ...c,
        progress: prog?.progress ?? 0,
        completed: prog?.completed ?? false,
      };
    }),
  };
}

export async function updateDailyChallengeProgressAction(spinData: {
  won: boolean;
  bonusTriggered: boolean;
  creditsWon: number;
  gameType: string;
}): Promise<{ completedChallenges: string[] }> {
  const session = await auth();
  if (!session?.user?.id) return { completedChallenges: [] };
  const userId = session.user.id;

  const dateStr = today();
  const todayChallenges = getDailyChallenges(dateStr);
  const completedChallenges: string[] = [];

  for (const challenge of todayChallenges) {
    const existing = await db.query.dailyChallengeProgress.findFirst({
      where: and(
        eq(dailyChallengeProgress.userId, userId),
        eq(dailyChallengeProgress.challengeId, challenge.id),
        eq(dailyChallengeProgress.date, dateStr)
      ),
    });

    if (existing?.completed) continue;

    let increment = 0;
    if (challenge.type === "spins") increment = 1;
    else if (challenge.type === "wins" && spinData.won) increment = 1;
    else if (challenge.type === "bonus" && spinData.bonusTriggered) increment = 1;
    else if (challenge.type === "credits_won" && spinData.creditsWon > 0) increment = spinData.creditsWon;
    else if (challenge.type === "games_played") increment = 1; // simplified

    if (increment === 0) continue;

    const newProgress = (existing?.progress ?? 0) + increment;
    const completed = newProgress >= challenge.target;

    if (existing) {
      await db.update(dailyChallengeProgress)
        .set({ progress: newProgress, completed, completedAt: completed ? new Date() : null })
        .where(eq(dailyChallengeProgress.id, existing.id));
    } else {
      await db.insert(dailyChallengeProgress).values({
        userId,
        challengeId: challenge.id,
        date: dateStr,
        progress: newProgress,
        completed,
        completedAt: completed ? new Date() : undefined,
      });
    }

    if (completed) completedChallenges.push(challenge.id);
  }

  return { completedChallenges };
}
