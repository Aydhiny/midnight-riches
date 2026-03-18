import { db } from "@/lib/db";
import { gameSessions } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export interface GameStats {
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  rtp: number;
  biggestWin: number;
}

export async function getGameStats(userId: string): Promise<GameStats> {
  const [result] = await db
    .select({
      totalSpins: sql<number>`count(*)`,
      totalWagered: sql<number>`coalesce(sum(${gameSessions.betAmount}), 0)`,
      totalWon: sql<number>`coalesce(sum(${gameSessions.winAmount}), 0)`,
      biggestWin: sql<number>`coalesce(max(${gameSessions.winAmount}), 0)`,
    })
    .from(gameSessions)
    .where(eq(gameSessions.userId, userId));

  const totalWagered = Number(result?.totalWagered ?? 0);
  const totalWon = Number(result?.totalWon ?? 0);

  return {
    totalSpins: Number(result?.totalSpins ?? 0),
    totalWagered,
    totalWon,
    rtp: totalWagered > 0 ? (totalWon / totalWagered) * 100 : 0,
    biggestWin: Number(result?.biggestWin ?? 0),
  };
}

export async function getRtpHistory(userId: string, limit = 100) {
  const sessions = await db.query.gameSessions.findMany({
    where: eq(gameSessions.userId, userId),
    orderBy: [desc(gameSessions.createdAt)],
    limit,
  });

  let runningWagered = 0;
  let runningWon = 0;

  return sessions.reverse().map((session, _index) => {
    runningWagered += Number(session.betAmount);
    runningWon += Number(session.winAmount);
    return {
      session: _index + 1,
      rtp: runningWagered > 0 ? (runningWon / runningWagered) * 100 : 0,
      bet: Number(session.betAmount),
      win: Number(session.winAmount),
    };
  });
}
