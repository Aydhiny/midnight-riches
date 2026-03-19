"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ── Request a password reset ──────────────────────────────────────────────────
export async function requestPasswordResetAction(email: string): Promise<{
  success: boolean;
  error?: string;
  // token is only returned in development; in prod you'd email this URL
  devToken?: string;
}> {
  try {
    const rl = checkRateLimit(`pw-reset:${email}`, { maxRequests: 3, windowMs: 3_600_000 });
    if (!rl.success) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    // Always return success to prevent email enumeration
    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });

    if (!user) {
      // Fake success — don't reveal whether the email exists
      return { success: true };
    }

    // Only credential accounts can reset password
    if (!user.passwordHash) {
      // OAuth account — also fake success
      return { success: true };
    }

    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + RESET_EXPIRY_MS);

    // Delete any existing tokens for this email first
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, `reset:${email}`));

    await db.insert(verificationTokens).values({
      identifier: `reset:${email}`,
      token,
      expires,
    });

    const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    logger.info("Password reset requested", {
      action: "password-reset-request",
      metadata: { email, resetUrl },
    });

    // In production: send resetUrl via email (Resend, SendGrid, etc.)
    // For now we return the token in dev mode so you can test without email
    return {
      success: true,
      devToken: process.env.NODE_ENV === "development" ? token : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Password reset request failed", {
      action: "password-reset-request",
      metadata: { error: message },
    });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ── Validate that a token is still valid ─────────────────────────────────────
export async function validateResetTokenAction(token: string, email: string): Promise<{
  valid: boolean;
}> {
  try {
    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    });
    return { valid: !!record };
  } catch {
    return { valid: false };
  }
}

// ── Reset the password ────────────────────────────────────────────────────────
export async function resetPasswordAction(
  token: string,
  email: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters." };
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return { success: false, error: "Password must include uppercase, lowercase, and a number." };
    }

    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    });

    if (!record) {
      return { success: false, error: "This reset link is invalid or has expired." };
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase().trim()),
    });
    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    // Delete the used token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, `reset:${email}`));

    logger.info("Password reset completed", {
      action: "password-reset",
      metadata: { email },
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Password reset failed", {
      action: "password-reset",
      metadata: { error: message },
    });
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
