"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";

type NotificationType =
  | "feature"
  | "daily_spin"
  | "daily_puzzle"
  | "community_win"
  | "jackpot"
  | "promotion"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: unknown;
  read: boolean;
  createdAt: Date;
}

interface NotificationsSuccess {
  success: true;
  notifications: Notification[];
}

interface CountSuccess {
  success: true;
  count: number;
}

interface ActionSuccess {
  success: true;
}

interface ActionError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "NOT_FOUND" | "INTERNAL_ERROR";
}

export async function getNotificationsAction(): Promise<NotificationsSuccess | ActionError> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, session.user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return { success: true, notifications: results as Notification[] };
  } catch {
    return { success: false, error: "Failed to fetch notifications", code: "INTERNAL_ERROR" };
  }
}

export async function markNotificationReadAction(id: string): Promise<ActionSuccess | ActionError> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = checkRateLimit(`notif-read:${session.user.id}`, {
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));

    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark notification as read", code: "INTERNAL_ERROR" };
  }
}

export async function markAllNotificationsReadAction(): Promise<ActionSuccess | ActionError> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = checkRateLimit(`notif-read-all:${session.user.id}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

    return { success: true };
  } catch {
    return { success: false, error: "Failed to mark all as read", code: "INTERNAL_ERROR" };
  }
}

export async function getUnreadCountAction(): Promise<CountSuccess | ActionError> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

    return { success: true, count: result?.count ?? 0 };
  } catch {
    return { success: false, error: "Failed to get unread count", code: "INTERNAL_ERROR" };
  }
}

/** Helper function (not a server action) to create a notification from other server actions */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  await db.insert(notifications).values({
    userId,
    type,
    title,
    message,
    metadata: metadata ?? null,
  });
}
