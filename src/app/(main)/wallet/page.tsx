"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useWalletStore } from "@/store/wallet-store";
import { createCheckoutAction, claimDailyBonusAction } from "@/server/actions/stripe";
import {
  getPaymentMethodsAction,
  createSetupIntentAction,
  removePaymentMethodAction,
  type SavedPaymentMethod,
} from "@/server/actions/payment-methods";
import { CREDIT_BUNDLES } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";
import type { CreditBundle } from "@/types";

function BundleCard({
  bundle,
  onPurchase,
  isPurchasing,
}: {
  bundle: CreditBundle;
  onPurchase: (id: string) => void;
  isPurchasing: boolean;
}) {
  const t = useTranslations("wallet");

  return (
    <Card
      className={`relative flex flex-col bg-[var(--bg-card)] border-[var(--glass-border)] ${
        bundle.popular
          ? "border-yellow-500/50 shadow-lg shadow-yellow-500/10 dark:shadow-yellow-500/10"
          : ""
      }`}
    >
      {bundle.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-3 py-0.5 text-xs font-bold text-black">
          {t("popular")}
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg text-[var(--text-primary)]">{bundle.name}</CardTitle>
        <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
          {bundle.credits.toLocaleString()}
        </div>
        <div className="text-sm text-[var(--text-muted)]">{t("credits")}</div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col items-center gap-3">
        <div className="text-2xl font-bold text-[var(--text-primary)]">${bundle.priceUsd.toFixed(2)}</div>
        <Button
          variant="gold"
          className="w-full"
          onClick={() => onPurchase(bundle.id)}
          disabled={isPurchasing}
        >
          {isPurchasing ? "..." : t("purchase")}
        </Button>
      </CardContent>
    </Card>
  );
}

function brandDisplayName(brand: string): string {
  const names: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };
  return names[brand] ?? brand.charAt(0).toUpperCase() + brand.slice(1);
}

function PaymentMethodsSection() {
  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMethods = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPaymentMethodsAction();
    if (result.success) {
      setMethods(result.methods);
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  async function handleAddCard() {
    setIsAdding(true);
    setError(null);
    const result = await createSetupIntentAction();
    if (result.success) {
      window.location.href = result.url;
    } else {
      setError(result.error);
      setIsAdding(false);
    }
  }

  async function handleRemoveCard(paymentMethodId: string) {
    setRemovingId(paymentMethodId);
    setError(null);
    const result = await removePaymentMethodAction(paymentMethodId);
    if (result.success) {
      setMethods((prev) => prev.filter((m) => m.id !== paymentMethodId));
    } else {
      setError(result.error);
    }
    setRemovingId(null);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Payment Methods</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCard}
          disabled={isAdding}
        >
          {isAdding ? "..." : "Add Payment Method"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
          <CardContent className="p-6 text-center text-[var(--text-muted)]">
            Loading saved cards...
          </CardContent>
        </Card>
      ) : methods.length === 0 ? (
        <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
          <CardContent className="p-6 text-center text-[var(--text-muted)]">
            No saved payment methods. Add a card for faster checkout.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods.map((method) => (
            <Card
              key={method.id}
              className="bg-[var(--bg-card)] border-[var(--glass-border)]"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-14 items-center justify-center rounded bg-[var(--glass-bg)] text-xs font-bold text-[var(--text-secondary)]">
                    {brandDisplayName(method.brand)}
                  </div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">
                      **** **** **** {method.last4}
                    </div>
                    <div className="text-sm text-[var(--text-muted)]">
                      Expires {String(method.expMonth).padStart(2, "0")}/{method.expYear}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  onClick={() => handleRemoveCard(method.id)}
                  disabled={removingId === method.id}
                >
                  {removingId === method.id ? "..." : "Remove"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WalletPage() {
  const t = useTranslations("wallet");
  const { balance, currency, setBalance } = useWalletStore();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);

  async function handlePurchase(bundleId: string) {
    setPurchasingId(bundleId);
    const result = await createCheckoutAction({ bundleId });
    if (result.success) {
      window.location.href = result.url;
    }
    setPurchasingId(null);
  }

  async function handleClaimBonus() {
    setClaimingBonus(true);
    setBonusMessage(null);
    const result = await claimDailyBonusAction();
    if (result.success) {
      setBalance(result.balance);
      setBonusMessage(t("bonusClaimed", { credits: result.credits }));
    } else {
      setBonusMessage(
        result.code === "ALREADY_CLAIMED"
          ? t("bonusAlreadyClaimed")
          : result.error
      );
    }
    setClaimingBonus(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4">
      <GlowCard
        className="p-8 text-center"
        glowColor="rgba(245, 200, 66, 0.2)"
      >
        <div className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">
          {t("balance")}
        </div>
        <div className="mt-2 text-5xl font-black text-amber-600 dark:text-yellow-400">
          {formatCurrency(balance, currency)}
        </div>
      </GlowCard>

      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{t("dailyBonus")}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {t("dailyBonusDescription")}
            </p>
            {bonusMessage && (
              <p className="mt-1 text-sm text-amber-600 dark:text-yellow-400">{bonusMessage}</p>
            )}
          </div>
          <Button
            variant="gold"
            onClick={handleClaimBonus}
            disabled={claimingBonus}
          >
            {claimingBonus ? "..." : t("claimBonus")}
          </Button>
        </CardContent>
      </Card>

      <PaymentMethodsSection />

      <div>
        <h2 className="mb-4 text-xl font-bold text-[var(--text-primary)]">{t("creditBundles")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_BUNDLES.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              onPurchase={handlePurchase}
              isPurchasing={purchasingId === bundle.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
