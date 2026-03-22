"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, referrals, wallets } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";

const REFERRAL_BONUS_CREDITS = 100;

function generateCode(userId: string): string {
  const random = randomBytes(4).toString("hex").toUpperCase();
  return `MR-${userId.slice(0, 4).toUpperCase()}-${random}`;
}

export async function getReferralInfoAction(): Promise<{
  success: boolean;
  code?: string;
  referralCount?: number;
  bonusEarned?: number;
  referredUsers?: Array<{ createdAt: Date; bonusCredited: boolean }>;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };
    const userId = session.user.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { referralCode: true },
    });

    let code = user?.referralCode;
    if (!code) {
      code = generateCode(userId);
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
    }

    const refs = await db.query.referrals.findMany({
      where: eq(referrals.referrerId, userId),
      columns: { createdAt: true, bonusCredited: true },
    });

    const bonusEarned = refs.filter((r) => r.bonusCredited).length * REFERRAL_BONUS_CREDITS;

    return {
      success: true,
      code,
      referralCount: refs.length,
      bonusEarned,
      referredUsers: refs.map((r) => ({ createdAt: r.createdAt, bonusCredited: r.bonusCredited })),
    };
  } catch (err) {
    logger.error("getReferralInfo failed", { action: "getReferralInfo", metadata: { error: String(err) } });
    return { success: false };
  }
}

export async function applyReferralCodeAction(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Not authenticated" };
    const userId = session.user.id;

    // Require verified email to prevent referral abuse
    const dbRef = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { emailVerified: true } });
    if (!dbRef?.emailVerified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED" };
    }

    const existing = await db.query.referrals.findFirst({
      where: eq(referrals.referredId, userId),
    });
    if (existing) return { success: false, error: "You have already used a referral code" };

    const referrer = await db.query.users.findFirst({
      where: eq(users.referralCode, code.trim().toUpperCase()),
      columns: { id: true },
    });
    if (!referrer) return { success: false, error: "Invalid referral code" };
    if (referrer.id === userId) return { success: false, error: "You cannot refer yourself" };

    await db.insert(referrals).values({
      referrerId: referrer.id,
      referredId: userId,
      code: code.trim().toUpperCase(),
      bonusCredited: true,
    });

    await db.update(wallets)
      .set({ balance: sql`${wallets.balance} + ${REFERRAL_BONUS_CREDITS.toString()}` })
      .where(eq(wallets.userId, referrer.id));
    await db.update(wallets)
      .set({ balance: sql`${wallets.balance} + ${REFERRAL_BONUS_CREDITS.toString()}` })
      .where(eq(wallets.userId, userId));

    logger.action("applyReferral", userId, 0, { code, referrerId: referrer.id });
    return { success: true };
  } catch (err) {
    logger.error("applyReferral failed", { action: "applyReferral", metadata: { error: String(err) } });
    return { success: false, error: "Internal error" };
  }
}
