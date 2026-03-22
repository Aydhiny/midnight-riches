"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getReferralInfoAction, applyReferralCodeAction } from "@/server/actions/referrals";
import { Check, Copy, Gift, Users } from "lucide-react";

interface ReferralInfo {
  code: string;
  referralCount: number;
  bonusEarned: number;
  referredUsers: Array<{ createdAt: Date; bonusCredited: boolean }>;
  alreadyReferred: boolean;
}

export function ReferralSection() {
  const t = useTranslations("settings.referral");
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getReferralInfoAction().then((res) => {
      if (res.success && res.code) {
        setInfo({
          code: res.code,
          referralCount: res.referralCount ?? 0,
          bonusEarned: res.bonusEarned ?? 0,
          referredUsers: res.referredUsers ?? [],
          alreadyReferred: (res.referralCount ?? 0) > 0,
        });
      }
      setLoading(false);
    });
  }, []);

  function handleCopy() {
    if (!info?.code) return;
    navigator.clipboard.writeText(info.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleApply() {
    if (!codeInput.trim()) return;
    setApplyError(null);
    startTransition(async () => {
      const res = await applyReferralCodeAction(codeInput.trim());
      if (res.success) {
        setApplySuccess(true);
        setCodeInput("");
        const updated = await getReferralInfoAction();
        if (updated.success && updated.code) {
          setInfo({
            code: updated.code,
            referralCount: updated.referralCount ?? 0,
            bonusEarned: updated.bonusEarned ?? 0,
            referredUsers: updated.referredUsers ?? [],
            alreadyReferred: (updated.referralCount ?? 0) > 0,
          });
        }
      } else {
        setApplyError(res.error ?? t("applyError"));
      }
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="space-y-4">
      {/* Your referral code */}
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
            <Gift className="h-5 w-5 text-violet-400" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--text-muted)]">{t("description")}</p>

          {/* Bonus explanation */}
          <div className="rounded-xl border border-violet-500/20 bg-violet-600/10 px-4 py-3">
            <p className="text-sm font-medium text-violet-300">{t("bonusExplain")}</p>
          </div>

          {/* Code display */}
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {t("yourCode")}
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-violet-300">
                {info.code}
              </div>
              <Button
                type="button"
                onClick={handleCopy}
                variant="outline"
                className="shrink-0 gap-2 border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-violet-400 hover:border-violet-400/40"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">{t("copied")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {t("copy")}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Users className="h-4 w-4 text-amber-400" />
                <span className="text-2xl font-black text-amber-400">{info.referralCount}</span>
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">{t("friendsReferred")}</div>
            </div>
            <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Gift className="h-4 w-4 text-emerald-400" />
                <span className="text-2xl font-black text-emerald-400">{info.bonusEarned}</span>
              </div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">{t("creditsEarned")}</div>
            </div>
          </div>

          {/* Recent referrals list */}
          {info.referredUsers.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {t("recentReferrals")}
              </p>
              <div className="space-y-1.5">
                {info.referredUsers.slice(0, 5).map((ref, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2"
                  >
                    <span className="text-sm text-[var(--text-secondary)]">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </span>
                    {ref.bonusCredited ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                        {t("bonusCredited")}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">{t("pending")}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enter a referral code */}
      {!applySuccess && (
        <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
          <CardHeader>
            <CardTitle className="text-base text-[var(--text-primary)]">{t("enterCode")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">{t("enterCodeDesc")}</p>
            <div className="flex gap-2">
              <Input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(e.target.value.toUpperCase());
                  setApplyError(null);
                }}
                placeholder="MR-XXXX-YYYY"
                className="font-mono tracking-widest"
                disabled={isPending}
              />
              <Button
                onClick={handleApply}
                disabled={isPending || !codeInput.trim()}
                className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isPending ? t("applying") : t("apply")}
              </Button>
            </div>
            {applyError && (
              <p className="text-sm text-red-400">{applyError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {applySuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
            <Check className="h-4 w-4" />
            {t("applySuccess")}
          </p>
        </div>
      )}
    </div>
  );
}
