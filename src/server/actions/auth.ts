"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users, wallets, verificationTokens } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signUpSchema, signInSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { createVerificationToken, sendVerificationEmail } from "@/lib/email";

interface AuthSuccess {
  success: true;
  /** Dev-only: set when account was created but the verification email failed to send. Never populated in production. */
  devEmailError?: string;
}

interface AuthError {
  success: false;
  error: string;
  code: "RATE_LIMITED" | "VALIDATION_ERROR" | "CONFLICT" | "UNAUTHORIZED" | "INTERNAL_ERROR";
  /** Dev-only: populated when the conflict path resent an email that failed to send. */
  devEmailError?: string;
}

type AuthResponse = AuthSuccess | AuthError;

/** Build a verification URL from env — never falls back to localhost. */
function buildVerifyUrl(token: string, email: string): string {
  const appUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const base = appUrl ?? "";
  return `${base}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

export async function signUpAction(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
  try {
    const ip = await getClientIp();
    const ipRateLimit = checkRateLimit(`signup-ip:${ip}`, { maxRequests: 3, windowMs: 3_600_000 });
    if (!ipRateLimit.success) {
      return { success: false, error: "Too many sign-up attempts. Please try again later.", code: "RATE_LIMITED" };
    }

    const emailRateLimit = checkRateLimit(`signup-email:${data.email}`, { maxRequests: 3, windowMs: 3_600_000 });
    if (!emailRateLimit.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = signUpSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return { success: false, error: firstError, code: "VALIDATION_ERROR" };
    }

    const existing = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (existing) {
      // Only treat as "pending verification" when there is an *active* (unexpired)
      // token in the DB. Users who registered before the verification requirement was
      // introduced have emailVerified=null but no token — they are valid accounts.
      if (!existing.emailVerified) {
        const activeToken = await db.query.verificationTokens.findFirst({
          where: and(
            eq(verificationTokens.identifier, existing.email),
            gt(verificationTokens.expires, new Date()),
          ),
        });

        if (activeToken) {
          // Genuine pending-verification account — resend the link.
          const verifyToken = await createVerificationToken(existing.email);
          const verifyUrl = buildVerifyUrl(verifyToken, existing.email);

          let devEmailError: string | undefined;
          try {
            await sendVerificationEmail(existing.email, verifyUrl);
          } catch (emailErr) {
            const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
            logger.error("Failed to resend verification email", { action: "signup", metadata: { email: existing.email, error: msg } });
            if (process.env.NODE_ENV === "development") devEmailError = msg;
          }

          return {
            success: false,
            error: "Account pending verification. A new confirmation link has been sent.",
            code: "CONFLICT",
            devEmailError,
          };
        }
      }

      // Verified account, or pre-verification legacy account — same response either way
      // (don't leak whether the email is verified or not).
      return { success: false, error: "Email already registered", code: "CONFLICT" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const [user] = await db
      .insert(users)
      .values({ name: parsed.data.name, email: parsed.data.email, passwordHash })
      .returning();

    let devEmailError: string | undefined;

    if (user) {
      await db.insert(wallets).values({
        userId: user.id,
        balance: "1000.00",
        currency: "USD",
      });

      // Send verification email — user must confirm before signing in
      const verifyToken = await createVerificationToken(user.email);
      const verifyUrl = buildVerifyUrl(verifyToken, user.email);

      try {
        await sendVerificationEmail(user.email, verifyUrl);
      } catch (emailErr) {
        const msg = emailErr instanceof Error ? emailErr.message : String(emailErr);
        logger.error("Failed to send verification email", { action: "signup", metadata: { email: user.email, error: msg } });
        if (process.env.NODE_ENV === "development") devEmailError = msg;
      }
    }

    logger.info("User registered", { action: "signup", metadata: { email: parsed.data.email } });

    // Don't sign in yet — user must verify email first
    return { success: true, devEmailError };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Signup failed", { action: "signup", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function signInAction(data: { email: string; password: string }): Promise<AuthResponse> {
  try {
    const rateLimitResult = checkRateLimit(`signin:${data.email}`, { maxRequests: 5, windowMs: 900_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many sign-in attempts. Please try again in 15 minutes.", code: "RATE_LIMITED" };
    }

    const parsed = signInSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
    }

    // Block sign-in only when there is an active verification token — same check as signup.
    // Legacy users (emailVerified=null, no token) can still sign in normally.
    const user = await db.query.users.findFirst({
      where: eq(users.email, parsed.data.email),
    });

    if (user?.passwordHash && !user.emailVerified) {
      const activeToken = await db.query.verificationTokens.findFirst({
        where: and(
          eq(verificationTokens.identifier, user.email),
          gt(verificationTokens.expires, new Date()),
        ),
      });

      if (activeToken) {
        return {
          success: false,
          error: "Please verify your email before signing in. Check your inbox for the confirmation link.",
          code: "UNAUTHORIZED",
        };
      }
    }

    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return { success: true };
  } catch {
    return { success: false, error: "Invalid credentials", code: "UNAUTHORIZED" };
  }
}
