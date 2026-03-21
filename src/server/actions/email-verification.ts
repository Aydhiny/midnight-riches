"use server";

import crypto from "crypto";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { sendVerificationEmail, sendWelcomeEmail } from "@/lib/email";

const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function sendVerificationEmailAction(email: string): Promise<{
  success: boolean;
  error?: string;
  devToken?: string;
}> {
  try {
    const rl = checkRateLimit(`verify:${email}`, { maxRequests: 3, windowMs: 3_600_000 });
    if (!rl.success) {
      return { success: false, error: "Too many requests. Please try again later." };
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
    if (!user) return { success: true }; // Silently succeed to prevent enumeration

    if (user.emailVerified) return { success: true }; // Already verified

    const token   = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + VERIFY_EXPIRY_MS);

    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${email}`));
    await db.insert(verificationTokens).values({ identifier: `verify:${email}`, token, expires });

    try {
      await sendVerificationEmail(email, token);
    } catch (e) {
      logger.error("Failed to send verification email", {
        action: "sendVerificationEmail",
        metadata: { error: e instanceof Error ? e.message : "unknown" },
      });
    }

    return {
      success: true,
      devToken: process.env.NODE_ENV === "development" ? token : undefined,
    };
  } catch (err) {
    logger.error("Email verification send failed", {
      action: "sendVerificationEmail",
      metadata: { error: err instanceof Error ? err.message : "unknown" },
    });
    return { success: false, error: "Something went wrong." };
  }
}

export async function verifyEmailAction(token: string, email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, `verify:${email}`),
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, new Date()),
      ),
    });

    if (!record) {
      return { success: false, error: "This verification link is invalid or has expired." };
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase().trim()) });
    if (!user) return { success: false, error: "User not found." };

    await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, user.id));
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, `verify:${email}`));

    // Send welcome email best-effort
    try {
      await sendWelcomeEmail(email, user.name ?? "Player");
    } catch {}

    logger.info("Email verified", { action: "verifyEmail", metadata: { email } });
    return { success: true };
  } catch (err) {
    logger.error("Email verification failed", {
      action: "verifyEmail",
      metadata: { error: err instanceof Error ? err.message : "unknown" },
    });
    return { success: false, error: "Something went wrong." };
  }
}
