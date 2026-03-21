import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout } from "@/server/actions/stripe";
import { db } from "@/lib/db";
import { collectibles, userCollectibles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body      = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured", { action: "stripeWebhook" });
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Webhook signature verification failed", {
      action: "stripeWebhook",
      metadata: { error: message },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        logger.info("Checkout not paid, skipping", {
          action: "stripeWebhook",
          metadata: { sessionId: session.id, status: session.payment_status },
        });
        break;
      }

      const userId = session.metadata?.userId;
      const type   = session.metadata?.type; // "bundle" | "collectible"

      if (!userId) {
        logger.error("Missing userId in checkout metadata", {
          action: "stripeWebhook",
          metadata: { sessionId: session.id },
        });
        break;
      }

      // ── Token bundle purchase ─────────────────────────────────────────────
      if (type === "bundle") {
        const bundleId = session.metadata?.bundleId;
        const credits  = parseInt(session.metadata?.credits || "0", 10);

        if (!bundleId || !credits) {
          logger.error("Missing bundle metadata in checkout session", {
            action: "stripeWebhook",
            metadata: { sessionId: session.id },
          });
          break;
        }

        const fulfilled = await fulfillCheckout(session.id, userId, bundleId, credits);
        if (!fulfilled) {
          logger.error("Bundle fulfillment failed", {
            action: "stripeWebhook",
            metadata: { sessionId: session.id, userId },
          });
        } else {
          logger.info("Bundle fulfilled", {
            action: "stripeWebhook",
            metadata: { bundleId, credits, userId },
          });
        }
        break;
      }

      // ── Collectible purchase ──────────────────────────────────────────────
      if (type === "collectible") {
        const collectibleId   = session.metadata?.collectibleId;
        const collectibleName = session.metadata?.collectibleName;

        if (!collectibleId) {
          logger.error("Missing collectibleId in checkout metadata", {
            action: "stripeWebhook",
            metadata: { sessionId: session.id },
          });
          break;
        }

        // Idempotency — skip if already granted
        const existing = await db
          .select({ id: userCollectibles.id })
          .from(userCollectibles)
          .where(
            and(
              eq(userCollectibles.userId, userId),
              eq(userCollectibles.collectibleId, collectibleId),
            ),
          );

        if (existing.length > 0) {
          logger.info("Collectible already owned, skipping", {
            action: "stripeWebhook",
            metadata: { collectibleId, userId },
          });
          break;
        }

        // Verify collectible exists and is active
        const [item] = await db
          .select({ id: collectibles.id })
          .from(collectibles)
          .where(and(eq(collectibles.id, collectibleId), eq(collectibles.isActive, true)));

        if (!item) {
          logger.error("Collectible not found or inactive", {
            action: "stripeWebhook",
            metadata: { collectibleId },
          });
          break;
        }

        await db.insert(userCollectibles).values({ userId, collectibleId });

        logger.info("Collectible granted", {
          action: "stripeWebhook",
          metadata: { collectibleId, collectibleName, userId },
        });
        break;
      }

      // Unknown type — log and continue
      logger.info(`Unhandled checkout type: ${type ?? "undefined"}`, {
        action: "stripeWebhook",
        metadata: { sessionId: session.id },
      });
      break;
    }

    default:
      logger.info(`Unhandled webhook event: ${event.type}`, { action: "stripeWebhook" });
  }

  return NextResponse.json({ received: true });
}
