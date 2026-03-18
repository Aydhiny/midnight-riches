import Stripe from "stripe";
import type { CreditBundle } from "@/types";

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
    stripePriceId: process.env.STRIPE_PRICE_STARTER || "price_starter",
  },
  {
    id: "popular",
    name: "Popular Pack",
    credits: 1200,
    priceUsd: 9.99,
    stripePriceId: process.env.STRIPE_PRICE_POPULAR || "price_popular",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium Pack",
    credits: 3000,
    priceUsd: 19.99,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || "price_premium",
  },
  {
    id: "whale",
    name: "High Roller",
    credits: 8000,
    priceUsd: 49.99,
    stripePriceId: process.env.STRIPE_PRICE_WHALE || "price_whale",
  },
];

export function getBundleById(id: string): CreditBundle | undefined {
  return CREDIT_BUNDLES.find((b) => b.id === id);
}

export const WELCOME_CREDITS = 500;
export const DAILY_BONUS_CREDITS = 50;
