"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useWalletStore } from "@/store/wallet-store";
import { createCheckoutAction, claimDailyBonusAction } from "@/server/actions/stripe";
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
      className={`relative flex flex-col ${
        bundle.popular
          ? "border-yellow-500/50 shadow-lg shadow-yellow-500/10"
          : ""
      }`}
    >
      {bundle.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-500 px-3 py-0.5 text-xs font-bold text-black">
          {t("popular")}
        </div>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-lg">{bundle.name}</CardTitle>
        <div className="text-3xl font-black text-yellow-400">
          {bundle.credits.toLocaleString()}
        </div>
        <div className="text-sm text-purple-400">{t("credits")}</div>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col items-center gap-3">
        <div className="text-2xl font-bold">${bundle.priceUsd.toFixed(2)}</div>
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
      {/* Balance Display */}
      <GlowCard
        className="p-8 text-center"
        glowColor="rgba(245, 200, 66, 0.2)"
      >
        <div className="text-sm uppercase tracking-wider text-purple-400">
          {t("balance")}
        </div>
        <div className="mt-2 text-5xl font-black text-yellow-400">
          {formatCurrency(balance, currency)}
        </div>
      </GlowCard>

      {/* Daily Bonus */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-lg font-bold">{t("dailyBonus")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("dailyBonusDescription")}
            </p>
            {bonusMessage && (
              <p className="mt-1 text-sm text-yellow-400">{bonusMessage}</p>
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

      {/* Credit Bundles */}
      <div>
        <h2 className="mb-4 text-xl font-bold">{t("creditBundles")}</h2>
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
