"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { users, wallets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signUpSchema, signInSchema } from "@/lib/validators";
import { signIn } from "@/lib/auth";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";

interface AuthSuccess {
  success: true;
}

interface AuthError {
  success: false;
  error: string;
  code: "RATE_LIMITED" | "VALIDATION_ERROR" | "CONFLICT" | "UNAUTHORIZED" | "INTERNAL_ERROR";
}

type AuthResponse = AuthSuccess | AuthError;

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
    const ipRateLimit = checkRateLimit(`signup-ip:${ip}`, {
      maxRequests: 3,
      windowMs: 3_600_000,
    });
    if (!ipRateLimit.success) {
      return { success: false, error: "Too many sign-up attempts. Please try again later.", code: "RATE_LIMITED" };
    }

    const emailRateLimit = checkRateLimit(`signup-email:${data.email}`, {
      maxRequests: 3,
      windowMs: 3_600_000,
    });
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
      return { success: false, error: "Email already registered", code: "CONFLICT" };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const [user] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
      })
      .returning();

    if (user) {
      await db.insert(wallets).values({
        userId: user.id,
        balance: "1000.00",
        currency: "USD",
      });
    }

    logger.info("User registered", { action: "signup", metadata: { email: parsed.data.email } });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Signup failed", { action: "signup", metadata: { error: message } });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

export async function signInAction(data: { email: string; password: string }): Promise<AuthResponse> {
  try {
    const rateLimitResult = checkRateLimit(`signin:${data.email}`, {
      maxRequests: 5,
      windowMs: 900_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many sign-in attempts. Please try again in 15 minutes.", code: "RATE_LIMITED" };
    }

    const parsed = signInSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
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
