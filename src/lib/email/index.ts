/**
 * Email sending via EmailJS REST API (server-side)
 *
 * ─── EMAILJS DASHBOARD SETUP ────────────────────────────────────────────────
 * Create THREE templates in EmailJS — each with:
 *   To Email  : {{to_email}}
 *   Subject   : (set a static subject in each template)
 *   Content   : paste the casino HTML from the setup guide, with {{verify_url}}
 *               / {{reset_url}} / {{user_name}} as the only dynamic variables
 *
 * In Account → Security, enable "Allow EmailJS API for non-browser applications"
 *
 * ─── ENV VARS REQUIRED ──────────────────────────────────────────────────────
 *   EMAILJS_SERVICE_ID
 *   EMAILJS_PUBLIC_KEY
 *   EMAILJS_PRIVATE_KEY
 *   EMAILJS_VERIFY_TEMPLATE_ID   ← verification email template
 *   EMAILJS_RESET_TEMPLATE_ID    ← password reset email template
 *   EMAILJS_WELCOME_TEMPLATE_ID  ← welcome email template (optional)
 * ────────────────────────────────────────────────────────────────────────────
 */

import { db } from "@/lib/db";
import { verificationTokens } from "@/lib/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { randomBytes } from "crypto";

const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
if (!APP_URL) throw new Error("NEXTAUTH_URL (or NEXT_PUBLIC_APP_URL) must be set in your environment.");
const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

// ─────────────────────────────────────────────────────────────────────────────
// Core EmailJS sender — passes ONLY small dynamic params, not full HTML blobs
// ─────────────────────────────────────────────────────────────────────────────

async function sendViaEmailJS(opts: {
  templateId: string;
  templateParams: Record<string, string>;
}): Promise<void> {
  const serviceId  = process.env.EMAILJS_SERVICE_ID;
  const publicKey  = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !opts.templateId || !publicKey || !privateKey) {
    throw new Error(
      "EmailJS not configured. Check EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, " +
      "EMAILJS_PRIVATE_KEY and the template ID env var."
    );
  }

  const res = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id:   serviceId,
      template_id:  opts.templateId,
      user_id:      publicKey,
      accessToken:  privateKey,
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
// Public send functions — only small URL/name params sent, HTML lives in EmailJS
// ─────────────────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string,
  verifyUrl: string,
): Promise<void> {
  // Fall back to reset template if verify template not configured — allows sharing one template
  const templateId = process.env.EMAILJS_VERIFY_TEMPLATE_ID ?? process.env.EMAILJS_RESET_TEMPLATE_ID;
  if (!templateId) throw new Error("No EmailJS template configured. Set EMAILJS_VERIFY_TEMPLATE_ID or EMAILJS_RESET_TEMPLATE_ID.");

  await sendViaEmailJS({
    templateId,
    templateParams: {
      to_email:   email,
      verify_url: verifyUrl,
      reset_url:  verifyUrl, // alias — works if template uses {{reset_url}}
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
  if (!templateId) return; // welcome email is optional

  await sendViaEmailJS({
    templateId,
    templateParams: {
      to_email:  email,
      user_name: name,
      game_url:  `${APP_URL}/game`,
    },
  });
}
