/**
 * Email sending via EmailJS REST API (server-side)
 *
 * ─── ENV VARS REQUIRED ──────────────────────────────────────────────────────
 *   EMAILJS_SERVICE_ID
 *   EMAILJS_PUBLIC_KEY
 *   EMAILJS_PRIVATE_KEY
 *   EMAILJS_VERIFY_TEMPLATE_ID   ← verification email template ({{verify_url}}, {{to_email}})
 *   EMAILJS_RESET_TEMPLATE_ID    ← password reset email template ({{reset_url}}, {{to_email}})
 *   EMAILJS_WELCOME_TEMPLATE_ID  ← welcome email (optional)
 *
 * Make sure "Allow EmailJS API for non-browser applications" is ON in
 * Account → Security in the EmailJS dashboard.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { db } from "@/lib/db";
import { verificationTokens } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const APP_URL =
  process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "";

// ─────────────────────────────────────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaEmailJS(opts: {
  templateId: string;
  templateParams: Record<string, string>;
}): Promise<void> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !publicKey || !privateKey) {
    throw new Error(
      "EmailJS not configured. Set EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY."
    );
  }

  if (!opts.templateId) {
    throw new Error("EmailJS template ID is missing. Check your env vars.");
  }

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:      serviceId,
      template_id:     opts.templateId,
      user_id:         publicKey,
      accessToken:     privateKey,
      template_params: opts.templateParams,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS ${res.status}: ${body}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function createVerificationToken(email: string): Promise<string> {
  const token   = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  await db.insert(verificationTokens).values({ identifier: email, token, expires });
  return token;
}

export async function consumeVerificationToken(
  token: string
): Promise<{ email: string } | null> {
  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, new Date())
    ),
  });

  if (!record) return null;

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));

  return { email: record.identifier };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public send functions
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  verifyUrl: string
): Promise<void> {
  const templateId = process.env.EMAILJS_VERIFY_TEMPLATE_ID;
  if (!templateId) throw new Error("EMAILJS_VERIFY_TEMPLATE_ID is not set.");

  await sendViaEmailJS({
    templateId,
    templateParams: {
      to_email:   email,
      verify_url: verifyUrl,
    },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
): Promise<void> {
  const templateId = process.env.EMAILJS_RESET_TEMPLATE_ID;
  if (!templateId) throw new Error("EMAILJS_RESET_TEMPLATE_ID is not set.");

  await sendViaEmailJS({
    templateId,
    templateParams: {
      to_email:  email,
      reset_url: resetUrl,
    },
  });
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  const templateId = process.env.EMAILJS_WELCOME_TEMPLATE_ID;
  if (!templateId) return; // optional — skip silently

  await sendViaEmailJS({
    templateId,
    templateParams: {
      to_email:  email,
      user_name: name,
      game_url:  `${APP_URL}/game`,
    },
  });
}
