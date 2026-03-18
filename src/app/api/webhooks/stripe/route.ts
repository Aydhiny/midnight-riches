import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { fulfillCheckout } from "@/server/actions/stripe";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET not configured", {
      action: "stripeWebhook",
    });
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
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
      const bundleId = session.metadata?.bundleId;
      const credits = parseInt(session.metadata?.credits || "0", 10);

      if (!userId || !bundleId || !credits) {
        logger.error("Missing metadata in checkout session", {
          action: "stripeWebhook",
          metadata: { sessionId: session.id },
        });
        break;
      }

      const fulfilled = await fulfillCheckout(
        session.id,
        userId,
        bundleId,
        credits
      );

      if (!fulfilled) {
        logger.error("Fulfillment failed", {
          action: "stripeWebhook",
          metadata: { sessionId: session.id, userId },
        });
      }

      break;
    }
    default:
      logger.info(`Unhandled webhook event: ${event.type}`, {
        action: "stripeWebhook",
      });
  }

  return NextResponse.json({ received: true });
}
