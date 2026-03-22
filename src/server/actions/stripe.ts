"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { wallets, transactions, collectibles, userCollectibles, users } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { checkRateLimitAsync } from "@/lib/server/rate-limiter";
import { logger } from "@/lib/logger";
import { getStripe, getBundleById, DAILY_BONUS_CREDITS, getOrCreateStripeCustomer } from "@/lib/stripe";
import { purchaseBundleSchema } from "@/lib/validators";
import { isUserExcluded } from "@/lib/security/spin-guard";

interface CheckoutSuccess {
  success: true;
  sessionId: string;
  url: string;
}

interface CheckoutError {
  success: false;
  error: string;
  code:
    | "UNAUTHORIZED"
    | "RATE_LIMITED"
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "INTERNAL_ERROR";
}

type CheckoutResponse = CheckoutSuccess | CheckoutError;

export async function createCheckoutAction(data: {
  bundleId: string;
}): Promise<CheckoutResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    // Block self-excluded users from making purchases
    if (await isUserExcluded(userId)) {
      return { success: false, error: "Account is self-excluded", code: "UNAUTHORIZED" };
    }

    // Require verified email before allowing purchases
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { emailVerified: true } });
    if (!dbUser?.emailVerified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED", code: "UNAUTHORIZED" };
    }

    const rateLimitResult = await checkRateLimitAsync(`checkout:${userId}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many requests",
        code: "RATE_LIMITED",
      };
    }

    const parsed = purchaseBundleSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid bundle",
        code: "VALIDATION_ERROR",
      };
    }

    const bundle = getBundleById(parsed.data.bundleId);
    if (!bundle) {
      return { success: false, error: "Bundle not found", code: "NOT_FOUND" };
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Get or create a Stripe customer so saved cards work
    const customerId = await getOrCreateStripeCustomer(
      userId,
      session.user.email ?? "",
      session.user.name ?? undefined
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product: bundle.stripeProductId,
            unit_amount: Math.round(bundle.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: "on_session",
      },
      metadata: {
        userId,
        type: "bundle",
        bundleId: bundle.id,
        credits: bundle.credits.toString(),
      },
      success_url: `${appUrl}/wallet?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/wallet?purchase=cancelled`,
    });

    logger.action("createCheckout", userId, 0, {
      bundleId: bundle.id,
      credits: bundle.credits,
    });

    return {
      success: true,
      sessionId: checkoutSession.id,
      url: checkoutSession.url || `${appUrl}/wallet`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Checkout creation failed", {
      action: "createCheckout",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}

/**
 * Fulfill a Stripe checkout by crediting the user's wallet.
 * Called from the webhook handler. Idempotent via metadata check.
 */
export async function fulfillCheckout(
  sessionId: string,
  userId: string,
  bundleId: string,
  credits: number
): Promise<boolean> {
  try {
    // Idempotency check — look for existing transaction with this session ID
    const existing = await db.query.transactions.findFirst({
      where: (t, { and, eq: eqOp }) =>
        and(
          eqOp(t.userId, userId),
          eqOp(t.type, "purchase"),
          sql`${t.metadata}->>'stripeSessionId' = ${sessionId}`
        ),
    });

    if (existing) {
      logger.info("Duplicate fulfillment skipped", {
        action: "fulfillCheckout",
        metadata: { sessionId },
      });
      return true;
    }

    // Credit the wallet
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${credits.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    // Record the transaction
    await db.insert(transactions).values({
      userId,
      type: "purchase",
      amount: credits.toString(),
      metadata: {
        stripeSessionId: sessionId,
        bundleId,
        credits,
      },
    });

    logger.action("fulfillCheckout", userId, 0, {
      sessionId,
      bundleId,
      credits,
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Fulfillment failed", {
      action: "fulfillCheckout",
      metadata: { error: message, sessionId },
    });
    return false;
  }
}

// ── Collectible Checkout ───────────────────────────────────────────────────────

interface CollectibleCheckoutSuccess { success: true; url: string }
interface CollectibleCheckoutError   { success: false; error: string }
type CollectibleCheckoutResponse = CollectibleCheckoutSuccess | CollectibleCheckoutError;

export async function createCollectibleCheckoutAction(data: {
  collectibleId: string;
  name: string;
  description: string;
  priceUsd: number;
}): Promise<CollectibleCheckoutResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }
    const userId = session.user.id;

    // Block self-excluded users from making purchases
    if (await isUserExcluded(userId)) {
      return { success: false, error: "Account is self-excluded" };
    }

    // Require verified email before allowing purchases
    const dbUserC = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { emailVerified: true } });
    if (!dbUserC?.emailVerified) {
      return { success: false, error: "EMAIL_NOT_VERIFIED" };
    }

    const rateLimitResult = await checkRateLimitAsync(`checkout:${userId}`, {
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return { success: false, error: "Too many requests" };
    }

    const stripe   = getStripe();
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const customerId = await getOrCreateStripeCustomer(
      userId,
      session.user.email ?? "",
      session.user.name ?? undefined,
    );

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: data.name,
              description: data.description || undefined,
            },
            unit_amount: Math.round(data.priceUsd * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        type: "collectible",
        collectibleId: data.collectibleId,
        collectibleName: data.name,
      },
      success_url: `${appUrl}/shop?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${appUrl}/shop`,
    });

    logger.action("createCollectibleCheckout", userId, 0, {
      collectibleId: data.collectibleId,
      priceUsd: data.priceUsd,
    });

    return { success: true, url: checkoutSession.url! };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Collectible checkout failed", {
      action: "createCollectibleCheckout",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error" };
  }
}

/**
 * Called when returning from Stripe collectible checkout.
 * Acts as a belt-and-suspenders fallback in case the webhook hasn't fired yet.
 */
export async function verifyCollectiblePurchaseAction(
  sessionId: string
): Promise<{ success: boolean; alreadyOwned?: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    const stripe = getStripe();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      checkoutSession.payment_status !== "paid" ||
      checkoutSession.metadata?.type !== "collectible" ||
      checkoutSession.metadata?.userId !== session.user.id
    ) {
      return { success: false };
    }

    const collectibleId = checkoutSession.metadata?.collectibleId;
    if (!collectibleId) return { success: false };

    // Idempotency — already granted (webhook fired first)
    const [existing] = await db
      .select({ id: userCollectibles.id })
      .from(userCollectibles)
      .where(
        and(
          eq(userCollectibles.userId, session.user.id),
          eq(userCollectibles.collectibleId, collectibleId)
        )
      );

    if (existing) return { success: true, alreadyOwned: true };

    // Verify item exists
    const [item] = await db
      .select({ id: collectibles.id })
      .from(collectibles)
      .where(and(eq(collectibles.id, collectibleId), eq(collectibles.isActive, true)));

    if (!item) return { success: false };

    await db.insert(userCollectibles).values({
      userId: session.user.id,
      collectibleId,
    });

    logger.info("Collectible granted via client fallback", {
      action: "verifyCollectiblePurchase",
      metadata: { collectibleId, sessionId },
    });

    return { success: true };
  } catch (err) {
    logger.error("verifyCollectiblePurchase failed", {
      action: "verifyCollectiblePurchase",
      metadata: { error: String(err) },
    });
    return { success: false };
  }
}

interface DailyBonusSuccess {
  success: true;
  credits: number;
  balance: number;
}

interface DailyBonusError {
  success: false;
  error: string;
  code: "UNAUTHORIZED" | "RATE_LIMITED" | "ALREADY_CLAIMED" | "INTERNAL_ERROR";
}

type DailyBonusResponse = DailyBonusSuccess | DailyBonusError;

export async function claimDailyBonusAction(): Promise<DailyBonusResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const userId = session.user.id;

    const rateLimitResult = await checkRateLimitAsync(`dailyBonus:${userId}`, {
      maxRequests: 1,
      windowMs: 60_000,
    });
    if (!rateLimitResult.success) {
      return {
        success: false,
        error: "Too many requests",
        code: "RATE_LIMITED",
      };
    }

    // Check if already claimed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alreadyClaimed = await db.query.transactions.findFirst({
      where: (t, { and, eq: eqOp, gte }) =>
        and(
          eqOp(t.userId, userId),
          eqOp(t.type, "bonus"),
          gte(t.createdAt, today),
          sql`${t.metadata}->>'type' = 'daily_bonus'`
        ),
    });

    if (alreadyClaimed) {
      return {
        success: false,
        error: "Already claimed today",
        code: "ALREADY_CLAIMED",
      };
    }

    // Credit the bonus
    await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${DAILY_BONUS_CREDITS.toString()}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    await db.insert(transactions).values({
      userId,
      type: "bonus",
      amount: DAILY_BONUS_CREDITS.toString(),
      metadata: { type: "daily_bonus" },
    });

    const updated = await db.query.wallets.findFirst({
      where: eq(wallets.userId, userId),
    });

    logger.action("claimDailyBonus", userId, 0, {
      credits: DAILY_BONUS_CREDITS,
    });

    return {
      success: true,
      credits: DAILY_BONUS_CREDITS,
      balance: Number(updated?.balance ?? 0),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Daily bonus failed", {
      action: "claimDailyBonus",
      metadata: { error: message },
    });
    return { success: false, error: "Internal error", code: "INTERNAL_ERROR" };
  }
}
