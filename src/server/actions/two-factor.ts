"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateTotpSecret, generateQrDataUrl, verifyTotpCode } from "@/lib/2fa";
import { logger } from "@/lib/logger";

// ── Begin 2FA setup: generate secret + QR code ───────────────────────────────
export async function begin2FASetupAction(): Promise<{
  success: boolean;
  secret?: string;
  qrDataUrl?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true, twoFactorEnabled: true },
  });
  if (!user) return { success: false, error: "User not found" };
  if (user.twoFactorEnabled) return { success: false, error: "2FA is already enabled" };

  const secret = generateTotpSecret();
  const qrDataUrl = await generateQrDataUrl(secret, user.email);

  // Store secret temporarily (unconfirmed) so the verify step can read it
  await db.update(users).set({ twoFactorSecret: secret }).where(eq(users.id, session.user.id));

  return { success: true, secret, qrDataUrl };
}

// ── Confirm 2FA setup: verify first code then enable ─────────────────────────
export async function confirm2FASetupAction(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret) return { success: false, error: "No pending 2FA setup found" };

  if (!verifyTotpCode(code, user.twoFactorSecret)) {
    return { success: false, error: "Invalid code — try again" };
  }

  await db.update(users)
    .set({ twoFactorEnabled: true })
    .where(eq(users.id, session.user.id));

  logger.action("enable2FA", session.user.id, 0, {});
  return { success: true };
}

// ── Disable 2FA: require current code to confirm ─────────────────────────────
export async function disable2FAAction(code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA is not enabled" };
  }

  if (!verifyTotpCode(code, user.twoFactorSecret)) {
    return { success: false, error: "Invalid code — try again" };
  }

  await db.update(users)
    .set({ twoFactorEnabled: false, twoFactorSecret: null })
    .where(eq(users.id, session.user.id));

  logger.action("disable2FA", session.user.id, 0, {});
  return { success: true };
}

// ── Get 2FA status ────────────────────────────────────────────────────────────
export async function get2FAStatusAction(): Promise<{
  success: boolean;
  enabled?: boolean;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { twoFactorEnabled: true },
  });
  if (!user) return { success: false, error: "User not found" };

  return { success: true, enabled: user.twoFactorEnabled };
}

// ── Verify 2FA code during login (no active session yet) ─────────────────────
// Called from the /auth/verify-2fa page with userId from the pending cookie
export async function verifyLogin2FAAction(userId: string, code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "2FA not configured for this account" };
  }

  if (!verifyTotpCode(code, user.twoFactorSecret)) {
    return { success: false, error: "Invalid code — try again" };
  }

  return { success: true };
}
