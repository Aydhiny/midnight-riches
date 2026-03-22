"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import { useWalletStore } from "@/store/wallet-store";
import { createCheckoutAction, claimDailyBonusAction } from "@/server/actions/stripe";
import {
  getPaymentMethodsAction,
  createSetupIntentAction,
  removePaymentMethodAction,
  getEmailVerifiedAction,
  type SavedPaymentMethod,
} from "@/server/actions/payment-methods";
import { getWalletAction } from "@/server/actions/wallet";
import { CREDIT_BUNDLES } from "@/lib/stripe";
import type { CreditBundle } from "@/types";
import { useSession } from "next-auth/react";
import { sendVerificationEmailAction } from "@/server/actions/email-verification";
import { CheckCircle2, X, MailWarning, Send } from "lucide-react";

// ── Purchase success modal ──────────────────────────────────────────────────

function PurchaseSuccessModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("wallet");
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-amber-500/30 bg-[var(--bg-card)] shadow-2xl"
          style={{ boxShadow: "0 0 80px rgba(251,191,36,0.15)" }}
        >
          {/* Gold shimmer bar */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #fbbf24 40%, #fff 50%, #fbbf24 60%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "goldShimmer 2.2s linear infinite",
            }}
          />
          <style>{`
            @keyframes goldShimmer {
              0%   { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
          `}</style>

          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/15">
                <CheckCircle2 className="h-10 w-10 text-amber-400" />
              </div>
            </motion.div>

            <div>
              <h2 className="text-2xl font-black text-amber-400">{t("purchaseSuccess.title")}</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">{t("purchaseSuccess.message")}</p>
            </div>

            <Button variant="gold" className="mt-2 w-full" onClick={onClose}>
              {t("purchaseSuccess.close")}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="absolute right-3 top-3 rounded-full p-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ── Bundle card ──────────────────────────────────────────────────────────────

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

// ── Payment methods ──────────────────────────────────────────────────────────

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

function PaymentMethodsSection({ emailVerified }: { emailVerified: boolean | null }) {
  const t = useTranslations("wallet");
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
    if (emailVerified === false) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setIsAdding(true);
    setError(null);
    const result = await createSetupIntentAction();
    if (result.success) {
      window.location.href = result.url;
    } else if (result.error === "EMAIL_NOT_VERIFIED") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setIsAdding(false);
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
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("paymentMethods")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddCard}
          disabled={isAdding || emailVerified === false}
          title={emailVerified === false ? t("verifyEmailTitle") : undefined}
        >
          {isAdding ? "..." : t("addPaymentMethod")}
        </Button>
      </div>
      {emailVerified === false && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-sm text-amber-400">
          {t("verifyEmailToAddCard")}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {isLoading ? (
        <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
          <CardContent className="p-6 text-center text-[var(--text-muted)]">
            {t("loadingCards")}
          </CardContent>
        </Card>
      ) : methods.length === 0 ? (
        <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
          <CardContent className="p-6 text-center text-[var(--text-muted)]">
            {t("noSavedCards")}
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
                      {t("expires")} {String(method.expMonth).padStart(2, "0")}/{method.expYear}
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
                  {removingId === method.id ? "..." : t("remove")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

// ── Email verification banner ───────────────────────────────────────────────

function EmailVerificationBanner({ emailVerified }: { emailVerified: boolean | null }) {
  const t = useTranslations("wallet");
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !session?.user || emailVerified !== false) return null;

  async function resend() {
    if (!session?.user?.email) return;
    setSending(true);
    await sendVerificationEmailAction(session.user.email);
    setSent(true);
    setSending(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-4"
    >
      <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-300">{t("verifyEmailTitle")}</p>
        <p className="mt-0.5 text-xs text-amber-400/70">{t("verifyEmailDesc")}</p>
        {sent ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("verifyEmailSent")}
          </p>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
            {sending ? t("verifyEmailSending") : t("verifyEmailResend")}
          </button>
        )}
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400/50 hover:text-amber-300 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

export default function WalletPage() {
  const t = useTranslations("wallet");
  const { data: session } = useSession();
  const { balance, setBalance } = useWalletStore();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [claimingBonus, setClaimingBonus] = useState(false);
  const [bonusMessage, setBonusMessage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    getEmailVerifiedAction().then((res) => setEmailVerified(res.verified));
  }, []);

  // Detect successful Stripe redirect and refresh balance from DB
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") {
      window.history.replaceState({}, "", "/wallet");
      // Fetch fresh balance from server (webhook may have already credited)
      getWalletAction().then((res) => {
        if (res.success) setBalance(res.balance);
      });
      setShowSuccessModal(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePurchase(bundleId: string) {
    setPurchasingId(bundleId);
    const result = await createCheckoutAction({ bundleId });
    if (result.success) {
      window.location.href = result.url;
    } else if (!result.success && result.error === "EMAIL_NOT_VERIFIED") {
      // Banner already visible — scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      {showSuccessModal && (
        <PurchaseSuccessModal onClose={() => setShowSuccessModal(false)} />
      )}
      <EmailVerificationBanner emailVerified={emailVerified} />

      <GlowCard
        className="p-8 text-center"
        glowColor="rgba(245, 200, 66, 0.2)"
      >
        <div className="text-sm uppercase tracking-wider text-[var(--text-secondary)]">
          {t("balance")}
        </div>
        <div className="mt-2 text-5xl font-black text-amber-600 dark:text-yellow-400">
          {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cr
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

      <PaymentMethodsSection emailVerified={emailVerified} />

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
