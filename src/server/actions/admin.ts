"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  users,
  wallets,
  transactions,
  gameSessions,
  securityEvents,
} from "@/lib/db/schema";
import { eq, sql, desc, like, count, sum, and, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import {
  adminUserSearchSchema,
  adminAdjustBalanceSchema,
} from "@/lib/validators";
import type { ActionResult } from "@/lib/server/action-wrapper";
import type { AdminKPIs, AdminUserRow } from "@/types";

/**
 * Server-side admin role check. All admin actions MUST call this first.
 */
async function requireAdmin(): Promise<
  { userId: string } | { error: ActionResult<never> }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      },
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user || user.role !== "admin") {
    logger.warn("Non-admin attempted admin action", {
      action: "adminAuth",
      metadata: { userId: session.user.id },
    });
    return {
      error: {
        success: false,
        error: "Forbidden — admin access required",
        code: "UNAUTHORIZED",
      },
    };
  }

  return { userId: session.user.id };
}

export async function getAdminKPIs(): Promise<ActionResult<AdminKPIs>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [userCount] = await db.select({ total: count() }).from(users);

    const [activeToday] = await db
      .select({ total: count() })
      .from(gameSessions)
      .where(gte(gameSessions.createdAt, today));

    const [revenue] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "purchase"));

    const [payouts] = await db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(eq(transactions.type, "win"));

    // Jackpot - import inline to avoid circular
    const { getJackpotState } = await import("@/lib/game/jackpot");
    const jackpotState = await getJackpotState();

    const totalRev = Number(revenue?.total ?? 0);
    const totalPay = Number(payouts?.total ?? 0);
    const houseEdge = totalRev > 0 ? ((totalRev - totalPay) / totalRev) * 100 : 0;

    return {
      success: true,
      data: {
        totalUsers: userCount?.total ?? 0,
        activeUsersToday: activeToday?.total ?? 0,
        totalRevenue: totalRev,
        totalPayouts: totalPay,
        houseEdge: Math.round(houseEdge * 100) / 100,
        activeJackpot: jackpotState?.currentAmount ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin KPIs failed", {
      action: "getAdminKPIs",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function getAdminUsers(input: {
  query?: string;
  page?: number;
  limit?: number;
  role?: "user" | "admin";
}): Promise<ActionResult<{ users: AdminUserRow[]; total: number }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const parsed = adminUserSearchSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
      };
    }

    const { query, page = 1, limit = 20, role } = parsed.data;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (query) {
      conditions.push(like(users.email, `%${query}%`));
    }
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        balance: wallets.balance,
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .where(whereClause)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ total: count() })
      .from(users)
      .where(whereClause);

    const adminUsers: AdminUserRow[] = results.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role as "user" | "admin",
      balance: Number(r.balance ?? 0),
      totalBets: 0, // Could be computed but expensive
      totalWins: 0,
      createdAt: r.createdAt,
      isSuspended: false, // TODO: add suspended field
    }));

    return {
      success: true,
      data: {
        users: adminUsers,
        total: totalResult?.total ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin users query failed", {
      action: "getAdminUsers",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function adminAdjustBalance(input: {
  userId: string;
  amount: number;
  reason: string;
}): Promise<ActionResult<{ newBalance: number }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const parsed = adminAdjustBalanceSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
      };
    }

    const { userId, amount, reason } = parsed.data;

    // Verify the target user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!targetUser) {
      return { success: false, error: "User not found", code: "NOT_FOUND" };
    }

    // Adjust balance
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record the transaction
    await db.insert(transactions).values({
      userId,
      type: amount >= 0 ? "deposit" : "withdrawal",
      amount: Math.abs(amount).toString(),
      metadata: {
        type: "admin_adjustment",
        reason,
        adjustedBy: adminCheck.userId,
      },
    });

    const updatedWallet = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    logger.action("adminAdjustBalance", adminCheck.userId, 0, {
      targetUserId: userId,
      amount,
      reason,
    });

    return {
      success: true,
      data: { newBalance: Number(updatedWallet?.balance ?? 0) },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin balance adjustment failed", {
      action: "adminAdjustBalance",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function getSecurityEvents(input?: {
  page?: number;
  limit?: number;
}): Promise<
  ActionResult<{
    events: Array<{
      id: string;
      userId: string;
      eventType: string;
      severity: string;
      details: unknown;
      createdAt: Date;
    }>;
    total: number;
  }>
> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 50;
    const offset = (page - 1) * limit;

    const events = await db.query.securityEvents.findMany({
      orderBy: (se, { desc: d }) => [d(se.createdAt)],
      limit,
      offset,
    });

    const [totalResult] = await db
      .select({ total: count() })
      .from(securityEvents);

    return {
      success: true,
      data: {
        events: events.map((e) => ({
          id: e.id,
          userId: e.userId,
          eventType: e.eventType,
          severity: e.severity,
          details: e.details,
          createdAt: e.createdAt,
        })),
        total: totalResult?.total ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Security events query failed", {
      action: "getSecurityEvents",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── Daily spin activity (last N days) ────────────────────────────────────────
export async function getSpinChartData(days = 14): Promise<ActionResult<{
  daily: Array<{ date: string; spins: number; wagered: number; payouts: number }>;
}>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date: sql<string>`date_trunc('day', ${gameSessions.createdAt})::date::text`,
        spins:    sql<number>`count(*)`,
        wagered:  sql<number>`coalesce(sum(${gameSessions.betAmount}), 0)`,
        payouts:  sql<number>`coalesce(sum(${gameSessions.winAmount}), 0)`,
      })
      .from(gameSessions)
      .where(gte(gameSessions.createdAt, since))
      .groupBy(sql`date_trunc('day', ${gameSessions.createdAt})`)
      .orderBy(sql`date_trunc('day', ${gameSessions.createdAt})`);

    // Fill in missing days with zeros
    const map = new Map(rows.map((r) => [r.date, r]));
    const daily: Array<{ date: string; spins: number; wagered: number; payouts: number }> = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const row = map.get(key);
      daily.push({
        date:    key,
        spins:   Number(row?.spins   ?? 0),
        wagered: Number(row?.wagered ?? 0),
        payouts: Number(row?.payouts ?? 0),
      });
    }

    return { success: true, data: { daily } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Spin chart failed", { action: "getSpinChartData", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── Top players by total wagered ──────────────────────────────────────────────
export async function getTopPlayers(limit = 10): Promise<ActionResult<{
  players: Array<{ id: string; name: string | null; email: string; totalWagered: number; totalWon: number; spins: number }>;
}>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const rows = await db
      .select({
        id:           gameSessions.userId,
        name:         users.name,
        email:        users.email,
        totalWagered: sql<number>`coalesce(sum(${gameSessions.betAmount}), 0)`,
        totalWon:     sql<number>`coalesce(sum(${gameSessions.winAmount}), 0)`,
        spins:        sql<number>`count(*)`,
      })
      .from(gameSessions)
      .innerJoin(users, eq(gameSessions.userId, users.id))
      .groupBy(gameSessions.userId, users.name, users.email)
      .orderBy(desc(sql`sum(${gameSessions.betAmount})`))
      .limit(limit);

    return {
      success: true,
      data: {
        players: rows.map((r) => ({
          id:           r.id,
          name:         r.name,
          email:        r.email,
          totalWagered: Number(r.totalWagered),
          totalWon:     Number(r.totalWon),
          spins:        Number(r.spins),
        })),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Top players failed", { action: "getTopPlayers", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── Recent game sessions ──────────────────────────────────────────────────────
export async function getRecentSessions(limit = 20): Promise<ActionResult<{
  sessions: Array<{
    id: string; userId: string; email: string; gameId: string;
    betAmount: number; winAmount: number; outcome: string; createdAt: Date;
  }>;
}>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const rows = await db
      .select({
        id:         gameSessions.id,
        userId:     gameSessions.userId,
        email:      users.email,
        gameId:     gameSessions.gameId,
        betAmount:  gameSessions.betAmount,
        winAmount:  gameSessions.winAmount,
        outcome:    gameSessions.outcome,
        createdAt:  gameSessions.createdAt,
      })
      .from(gameSessions)
      .innerJoin(users, eq(gameSessions.userId, users.id))
      .orderBy(desc(gameSessions.createdAt))
      .limit(limit);

    return {
      success: true,
      data: {
        sessions: rows.map((r) => ({
          id:        r.id,
          userId:    r.userId,
          email:     r.email,
          gameId:    r.gameId,
          betAmount: Number(r.betAmount),
          winAmount: Number(r.winAmount),
          outcome:   r.outcome,
          createdAt: r.createdAt,
        })),
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Recent sessions failed", { action: "getRecentSessions", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── New user registrations (last 30 days) ────────────────────────────────────
export async function getUserGrowthData(): Promise<ActionResult<{
  daily: Array<{ date: string; registrations: number }>;
}>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const rows = await db
      .select({
        date:  sql<string>`date_trunc('day', ${users.createdAt})::date::text`,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, since))
      .groupBy(sql`date_trunc('day', ${users.createdAt})`)
      .orderBy(sql`date_trunc('day', ${users.createdAt})`);

    const map = new Map(rows.map((r) => [r.date, r]));
    const daily: Array<{ date: string; registrations: number }> = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      daily.push({ date: key, registrations: Number(map.get(key)?.count ?? 0) });
    }

    return { success: true, data: { daily } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("User growth failed", { action: "getUserGrowthData", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── Toggle user role ──────────────────────────────────────────────────────────
export async function adminSetUserRole(userId: string, role: "user" | "admin"): Promise<ActionResult<{ ok: true }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    await db.update(users).set({ role }).where(eq(users.id, userId));
    logger.action("adminSetUserRole", adminCheck.userId, 0, { targetUserId: userId, role });
    return { success: true, data: { ok: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message, code: "INTERNAL_ERROR" };
  }
}
