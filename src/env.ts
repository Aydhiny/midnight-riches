/**
 * Environment variable validation — runs at server startup.
 *
 * Import this file in `next.config.ts` or the root layout to ensure
 * all required env vars are present before the app accepts requests.
 *
 * If a required variable is missing, the process exits with a clear
 * error message instead of a cryptic runtime failure.
 */

function missing(vars: string[]): never {
  const list = vars.map((v) => `  • ${v}`).join("\n");
  throw new Error(
    `\n\n🚫  Missing required environment variables:\n${list}\n\n` +
      `Copy .env.example to .env.local and fill in the values.\n`
  );
}

interface EnvSchema {
  required: string[];
  optional?: string[];
}

const schema: EnvSchema = {
  required: [
    // Database
    "DATABASE_URL",
    // Auth
    "AUTH_SECRET",
    "NEXT_PUBLIC_APP_URL",
    // Stripe
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    // OAuth — at least Google must be configured
    "AUTH_GOOGLE_ID",
    "AUTH_GOOGLE_SECRET",
  ],
  optional: [
    // OAuth (optional providers)
    "AUTH_GITHUB_ID",
    "AUTH_GITHUB_SECRET",
    "AUTH_DISCORD_ID",
    "AUTH_DISCORD_SECRET",
    // EmailJS
    "EMAILJS_SERVICE_ID",
    "EMAILJS_VERIFICATION_TEMPLATE_ID",
    "EMAILJS_RESET_TEMPLATE_ID",
    "NEXT_PUBLIC_EMAILJS_PUBLIC_KEY",
    // Upstash Redis (optional — rate limiter falls back to in-memory)
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    // Feature flags
    "SKIP_EMAIL_VERIFICATION",
  ],
};

function validateEnv(): void {
  // Skip validation during build-time static analysis
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const absent = schema.required.filter((key) => !process.env[key]);

  if (absent.length > 0) {
    missing(absent);
  }
}

// Run immediately on import (server-side only)
if (typeof window === "undefined") {
  validateEnv();
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  AUTH_SECRET: process.env.AUTH_SECRET!,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID!,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET!,
  // Optional
  AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
  AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
  AUTH_DISCORD_ID: process.env.AUTH_DISCORD_ID,
  AUTH_DISCORD_SECRET: process.env.AUTH_DISCORD_SECRET,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  SKIP_EMAIL_VERIFICATION: process.env.SKIP_EMAIL_VERIFICATION === "true",
} as const;
