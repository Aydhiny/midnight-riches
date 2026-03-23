"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  wallets,
  transactions,
  withdrawalRequests,
  users,
  adminAuditLogs,
} from "@/lib/db/schema";
import { eq, sql, desc, count, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import type { ActionResult } from "@/lib/server/action-wrapper";
import { z } from "zod";

// ── Validation ────────────────────────────────────────────────────────────────

const requestWithdrawalSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be positive")
    .min(10, "Minimum withdrawal is $10.00")
    .max(10_000, "Maximum withdrawal is $10,000.00"),
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WithdrawalRow {
  id: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "processing";
  notes: string | null;
  requestedAt: string; // ISO string (safe to cross server boundary)
  processedAt: string | null;
}

export interface AdminWithdrawalRow extends WithdrawalRow {
  userId: string;
  userEmail: string;
  userName: string | null;
}

// ── Admin guard ───────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<{ userId: string } | { error: ActionResult<never> }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: { success: false, error: "Unauthorized", code: "UNAUTHORIZED" } };
  }
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { role: true },
  });
  if (!user || user.role !== "admin") {
    return { error: { success: false, error: "Forbidden", code: "UNAUTHORIZED" } };
  }
  return { userId: session.user.id };
}

// ── User actions ──────────────────────────────────────────────────────────────

/**
 * Request a withdrawal. Deducts from the wallet immediately and records
 * the request as "pending" for admin review.
 */
export async function requestWithdrawalAction(
  data: { amount: number }
): Promise<ActionResult<{ withdrawal: WithdrawalRow; newBalance: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    // Rate limit: max 5 requests per hour
    const rl = checkRateLimit(`withdrawal:${userId}`, { maxRequests: 5, windowMs: 3_600_000 });
    if (!rl.success) {
      return { success: false, error: "Too many requests. Please wait before requesting again.", code: "RATE_LIMITED" };
    }

    const parsed = requestWithdrawalSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid amount", code: "VALIDATION_ERROR" };
    }

    const { amount } = parsed.data;
    const amountStr = amount.toFixed(2);

    // Fetch wallet and pending-request check in parallel to reduce round-trips
    const [wallet, existing] = await Promise.all([
      db.query.wallets.findFirst({ where: eq(wallets.userId, userId) }),
      db.query.withdrawalRequests.findFirst({
        where: and(
          eq(withdrawalRequests.userId, userId),
          sql`${withdrawalRequests.status} IN ('pending','processing')`
        ),
        columns: { id: true },
      }),
    ]);

    if (!wallet) {
      return { success: false, error: "Wallet not found", code: "NOT_FOUND" };
    }
    if (Number(wallet.balance) < amount) {
      return { success: false, error: "Insufficient balance", code: "VALIDATION_ERROR" };
    }
    if (existing) {
      return {
        success: false,
        error: "You already have a pending withdrawal request. Please wait for it to be processed.",
        code: "VALIDATION_ERROR",
      };
    }

    // Deduct from wallet, then insert transaction + request in parallel
    await db
      .update(wallets)
      .set({ balance: sql`${wallets.balance} - ${amountStr}`, updatedAt: new Date() })
      .where(eq(wallets.userId, userId));

    const [[row]] = await Promise.all([
      db.insert(withdrawalRequests).values({ userId, amount: amountStr }).returning(),
      db.insert(transactions).values({ userId, type: "withdrawal", amount: amountStr, metadata: { status: "pending" } }),
    ]);

    // Compute new balance locally — no extra round-trip needed
    const newBalance = Number(wallet.balance) - amount;

    logger.action("requestWithdrawal", userId, 0, { amount });

    return {
      success: true,
      data: {
        withdrawal: {
          id: row.id,
          amount: Number(row.amount),
          status: row.status,
          notes: row.notes,
          requestedAt: row.requestedAt.toISOString(),
          processedAt: row.processedAt?.toISOString() ?? null,
        },
        newBalance,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Withdrawal request failed", { action: "requestWithdrawal", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Cancel a pending withdrawal and refund the balance.
 */
export async function cancelWithdrawalAction(
  withdrawalId: string
): Promise<ActionResult<{ newBalance: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const withdrawal = await db.query.withdrawalRequests.findFirst({
      where: and(
        eq(withdrawalRequests.id, withdrawalId),
        eq(withdrawalRequests.userId, userId)
      ),
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found", code: "NOT_FOUND" };
    }
    if (withdrawal.status !== "pending") {
      return {
        success: false,
        error: "Only pending withdrawals can be cancelled",
        code: "VALIDATION_ERROR",
      };
    }

    // Refund the balance, cancel request, and insert transaction in parallel
    const amountStr = withdrawal.amount;
    const [updatedRows] = await Promise.all([
      db
        .update(wallets)
        .set({ balance: sql`${wallets.balance} + ${amountStr}`, updatedAt: new Date() })
        .where(eq(wallets.userId, userId))
        .returning({ balance: wallets.balance }),
      db
        .update(withdrawalRequests)
        .set({ status: "rejected", notes: "Cancelled by user", processedAt: new Date() })
        .where(eq(withdrawalRequests.id, withdrawalId)),
      db.insert(transactions).values({
        userId,
        type: "deposit",
        amount: amountStr,
        metadata: { type: "withdrawal_cancelled", withdrawalId },
      }),
    ]);

    return { success: true, data: { newBalance: Number(updatedRows[0]?.balance ?? 0) } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Cancel withdrawal failed", { action: "cancelWithdrawal", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Get the current user's withdrawal history.
 */
export async function getWithdrawalsAction(input?: {
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ withdrawals: WithdrawalRow[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const page = input?.page ?? 1;
    const limit = input?.limit ?? 10;
    const offset = (page - 1) * limit;

    const [rows, [totalResult]] = await Promise.all([
      db
        .select()
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, userId))
        .orderBy(desc(withdrawalRequests.requestedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(withdrawalRequests)
        .where(eq(withdrawalRequests.userId, userId)),
    ]);

    return {
      success: true,
      data: {
        withdrawals: rows.map((r) => ({
          id: r.id,
          amount: Number(r.amount),
          status: r.status,
          notes: r.notes,
          requestedAt: r.requestedAt.toISOString(),
          processedAt: r.processedAt?.toISOString() ?? null,
        })),
        total: totalResult?.total ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Get withdrawals failed", { action: "getWithdrawals", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

// ── Admin actions ─────────────────────────────────────────────────────────────

/**
 * Admin: list all withdrawal requests with user info.
 */
export async function adminGetWithdrawalsAction(input?: {
  status?: "pending" | "approved" | "rejected" | "processing" | "all";
  page?: number;
  limit?: number;
}): Promise<ActionResult<{ withdrawals: AdminWithdrawalRow[]; total: number }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const status = input?.status ?? "all";
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 25;
    const offset = (page - 1) * limit;

    const whereClause = status !== "all"
      ? eq(withdrawalRequests.status, status)
      : undefined;

    const [rows, [totalResult]] = await Promise.all([
      db
        .select({
          id: withdrawalRequests.id,
          amount: withdrawalRequests.amount,
          status: withdrawalRequests.status,
          notes: withdrawalRequests.notes,
          requestedAt: withdrawalRequests.requestedAt,
          processedAt: withdrawalRequests.processedAt,
          userId: withdrawalRequests.userId,
          userEmail: users.email,
          userName: users.name,
        })
        .from(withdrawalRequests)
        .innerJoin(users, eq(withdrawalRequests.userId, users.id))
        .where(whereClause)
        .orderBy(desc(withdrawalRequests.requestedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(withdrawalRequests)
        .where(whereClause),
    ]);

    return {
      success: true,
      data: {
        withdrawals: rows.map((r) => ({
          id: r.id,
          amount: Number(r.amount),
          status: r.status,
          notes: r.notes,
          requestedAt: r.requestedAt.toISOString(),
          processedAt: r.processedAt?.toISOString() ?? null,
          userId: r.userId,
          userEmail: r.userEmail,
          userName: r.userName,
        })),
        total: totalResult?.total ?? 0,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin get withdrawals failed", { action: "adminGetWithdrawals", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Admin: approve a withdrawal request.
 */
export async function adminApproveWithdrawalAction(
  withdrawalId: string,
  notes?: string
): Promise<ActionResult<{ ok: true }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const withdrawal = await db.query.withdrawalRequests.findFirst({
      where: eq(withdrawalRequests.id, withdrawalId),
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found", code: "NOT_FOUND" };
    }
    if (withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return { success: false, error: "Withdrawal cannot be approved in its current state", code: "VALIDATION_ERROR" };
    }

    await db
      .update(withdrawalRequests)
      .set({
        status: "approved",
        adminId: adminCheck.userId,
        notes: notes ?? null,
        processedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, withdrawalId));

    // Audit log
    await db.insert(adminAuditLogs).values({
      adminId: adminCheck.userId,
      action: "approve_withdrawal",
      targetUserId: withdrawal.userId,
      details: { withdrawalId, amount: withdrawal.amount, notes },
    });

    logger.action("adminApproveWithdrawal", adminCheck.userId, 0, { withdrawalId, amount: withdrawal.amount });

    return { success: true, data: { ok: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin approve withdrawal failed", { action: "adminApproveWithdrawal", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Admin: reject a withdrawal and refund the balance to the user.
 */
export async function adminRejectWithdrawalAction(
  withdrawalId: string,
  notes?: string
): Promise<ActionResult<{ ok: true }>> {
  const adminCheck = await requireAdmin();
  if ("error" in adminCheck) return adminCheck.error;

  try {
    const withdrawal = await db.query.withdrawalRequests.findFirst({
      where: eq(withdrawalRequests.id, withdrawalId),
    });

    if (!withdrawal) {
      return { success: false, error: "Withdrawal not found", code: "NOT_FOUND" };
    }
    if (withdrawal.status !== "pending" && withdrawal.status !== "processing") {
      return { success: false, error: "Withdrawal cannot be rejected in its current state", code: "VALIDATION_ERROR" };
    }

    // Refund balance
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${withdrawal.amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, withdrawal.userId));

    await db.insert(transactions).values({
      userId: withdrawal.userId,
      type: "deposit",
      amount: withdrawal.amount,
      metadata: { type: "withdrawal_refund", withdrawalId, reason: notes },
    });

    await db
      .update(withdrawalRequests)
      .set({
        status: "rejected",
        adminId: adminCheck.userId,
        notes: notes ?? null,
        processedAt: new Date(),
      })
      .where(eq(withdrawalRequests.id, withdrawalId));

    // Audit log
    await db.insert(adminAuditLogs).values({
      adminId: adminCheck.userId,
      action: "reject_withdrawal",
      targetUserId: withdrawal.userId,
      details: { withdrawalId, amount: withdrawal.amount, notes },
    });

    logger.action("adminRejectWithdrawal", adminCheck.userId, 0, { withdrawalId, amount: withdrawal.amount });

    return { success: true, data: { ok: true } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Admin reject withdrawal failed", { action: "adminRejectWithdrawal", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
