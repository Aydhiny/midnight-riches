"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { getStripe, getOrCreateStripeCustomer } from "@/lib/stripe";

// ── Types ──

export interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PaymentMethodsSuccess {
  success: true;
  methods: SavedPaymentMethod[];
}

interface PaymentMethodsError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "NO_CUSTOMER" | "INTERNAL_ERROR";
}

type PaymentMethodsResponse = PaymentMethodsSuccess | PaymentMethodsError;

interface SetupIntentSuccess {
  success: true;
  url: string;
}

interface SetupIntentError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "INTERNAL_ERROR";
}

type SetupIntentResponse = SetupIntentSuccess | SetupIntentError;

interface RemoveSuccess {
  success: true;
}

interface RemoveError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "VALIDATION_ERROR" | "INTERNAL_ERROR";
}

type RemoveResponse = RemoveSuccess | RemoveError;

// ── Actions ──

/**
 * Check whether the current user's email is verified.
 */
export async function getEmailVerifiedAction(): Promise<{ verified: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { verified: false };
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { emailVerified: true },
    });
    return { verified: !!user?.emailVerified };
  } catch {
    return { verified: false };
  }
}

/**
 * List all saved payment methods for the current user.
 */
export async function getPaymentMethodsAction(): Promise<PaymentMethodsResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = checkRateLimit(`paymentMethods:${session.user.id}`, {
      maxRequests: 20,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    // Look up the user's Stripe customer ID
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return { success: true, methods: [] };
    }

    const stripe = getStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    const methods: SavedPaymentMethod[] = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand ?? "unknown",
      last4: pm.card?.last4 ?? "????",
      expMonth: pm.card?.exp_month ?? 0,
      expYear: pm.card?.exp_year ?? 0,
    }));

    return { success: true, methods };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to list payment methods", {
      action: "getPaymentMethods",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Create a Stripe Checkout session in "setup" mode to add a new payment method.
 * Redirects the user to Stripe's hosted page.
 */
export async function createSetupIntentAction(): Promise<SetupIntentResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    // Require verified email before allowing payment method setup
    const dbPm = await db.query.users.findFirst({ where: eq(users.id, session.user.id), columns: { emailVerified: true } });
    if (!dbPm?.emailVerified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = checkRateLimit(`setupIntent:${session.user.id}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email ?? "",
      session.user.name ?? undefined
    );

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${appUrl}/wallet?setup=success`,
      cancel_url: `${appUrl}/wallet?setup=cancelled`,
    });

    logger.action("createSetupIntent", session.user.id, 0, {});

    return {
      success: true,
      url: checkoutSession.url || `${appUrl}/wallet`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to create setup intent", {
      action: "createSetupIntent",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Remove (detach) a saved payment method from the customer.
 */
export async function removePaymentMethodAction(
  paymentMethodId: string
): Promise<RemoveResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = checkRateLimit(`removePayment:${session.user.id}`, {
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests", code: "RATE_LIMITED" };
    }

    if (!paymentMethodId || typeof paymentMethodId !== "string" || !paymentMethodId.startsWith("pm_")) {
      return { success: false, error: "Invalid payment method ID", code: "VALIDATION_ERROR" };
    }

    // Verify the payment method belongs to this user's customer
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return { success: false, error: "No customer found", code: "VALIDATION_ERROR" };
    }

    const stripe = getStripe();
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (pm.customer !== user.stripeCustomerId) {
      return { success: false, error: "Payment method not found", code: "VALIDATION_ERROR" };
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    logger.action("removePaymentMethod", session.user.id, 0, {
      paymentMethodId,
    });

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Failed to remove payment method", {
      action: "removePaymentMethod",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
