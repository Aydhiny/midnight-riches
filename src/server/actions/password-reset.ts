"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ── Request a password reset ──────────────────────────────────────────────────
export async function requestPasswordResetAction(email: string): Promise<{
  success: boolean;
  error?: string;
  devToken?: string;
  devEmailError?: string;
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

    const rawToken  = crypto.randomBytes(32).toString("hex");
    // Store only the SHA-256 hash — raw token is sent to user via email, never stored
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires   = new Date(Date.now() + RESET_EXPIRY_MS);

    // Delete any existing tokens for this email first
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, `reset:${email}`));

    await db.insert(verificationTokens).values({
      identifier: `reset:${email}`,
      token: tokenHash,
      expires,
    });

    const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) throw new Error("NEXTAUTH_URL or NEXT_PUBLIC_APP_URL must be set.");

    const resetUrl = `${appUrl}/auth/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

    logger.info("Password reset requested", {
      action: "password-reset-request",
      metadata: { email },
    });

    // Send reset email (best-effort — don't fail the action if email sending fails)
    let devEmailError: string | undefined;
    try {
      await sendPasswordResetEmail(email, resetUrl);
    } catch (emailErr) {
      const errMsg = emailErr instanceof Error ? emailErr.message : "unknown";
      logger.error("Failed to send reset email", {
        action: "password-reset-request",
        metadata: { error: errMsg },
      });
      if (process.env.NODE_ENV === "development") {
        devEmailError = errMsg;
      }
    }

    return {
      success: true,
      devToken: process.env.NODE_ENV === "development" ? rawToken : undefined,
      devEmailError,
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
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, tokenHash),
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

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `reset:${email}`),
        eq(verificationTokens.token, tokenHash),
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
