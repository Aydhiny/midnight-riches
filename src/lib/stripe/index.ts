import Stripe from "stripe";
import type { CreditBundle } from "@/types";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export const CREDIT_BUNDLES: CreditBundle[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 500,
    priceUsd: 4.99,
    stripeProductId: process.env.STRIPE_PRODUCT_STARTER || "prod_UBtWcCOazqHyNK",
  },
  {
    id: "popular",
    name: "Popular Pack",
    credits: 1200,
    priceUsd: 9.99,
    stripeProductId: process.env.STRIPE_PRODUCT_POPULAR || "prod_UBtXj8Fzvuppjm",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Pack",
    credits: 3000,
    priceUsd: 19.99,
    stripeProductId: process.env.STRIPE_PRODUCT_PREMIUM || "prod_UBtYbs3B3jKoQi",
  },
];

export function getBundleById(id: string): CreditBundle | undefined {
  return CREDIT_BUNDLES.find((b) => b.id === id);
}

export const WELCOME_CREDITS = 500;
export const DAILY_BONUS_CREDITS = 50;

/**
 * Get or create a Stripe customer for the given user.
 * Stores the Stripe customer ID in the users table for future lookups.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if user already has a stripeCustomerId in DB
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe customer
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });

  // Save the customer ID to the database
  await db
    .update(users)
    .set({ stripeCustomerId: customer.id })
    .where(eq(users.id, userId));

  return customer.id;
}
