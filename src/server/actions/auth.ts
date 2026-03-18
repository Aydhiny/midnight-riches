"use server";

import { db } from "@/lib/db";
import { users, wallets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validators";
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

export async function signUpAction(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
  try {
    const rateLimitResult = checkRateLimit(`signup:${data.email}`, { maxRequests: 5, windowMs: 300_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const parsed = signUpSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input", code: "VALIDATION_ERROR" };
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
    const rateLimitResult = checkRateLimit(`signin:${data.email}`, { maxRequests: 10, windowMs: 300_000 });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
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
