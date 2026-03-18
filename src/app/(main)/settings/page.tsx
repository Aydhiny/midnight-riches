"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  setGamblingLimit,
  getGamblingLimits,
  selfExclude,
  getExclusionStatus,
} from "@/server/actions/responsible-gambling";
import type { GamblingLimit, SelfExclusion } from "@/types";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const [limits, setLimits] = useState<GamblingLimit[]>([]);
  const [exclusion, setExclusion] = useState<SelfExclusion | null>(null);
  const [loading, setLoading] = useState(true);

  // Limit form state
  const [limitType, setLimitType] = useState<"deposit" | "loss" | "session">("loss");
  const [limitValue, setLimitValue] = useState("");
  const [periodDays, setPeriodDays] = useState("1");

  // Exclusion form state
  const [excludeType, setExcludeType] = useState<"temporary" | "permanent">("temporary");
  const [excludeDays, setExcludeDays] = useState("7");
  const [excludeReason, setExcludeReason] = useState("");
  const [confirmExclude, setConfirmExclude] = useState(false);

  useEffect(() => {
    async function load() {
      const [limitsResult, exclusionResult] = await Promise.all([
        getGamblingLimits(),
        getExclusionStatus(),
      ]);
      if (limitsResult.success) setLimits(limitsResult.data);
      if (exclusionResult.success) setExclusion(exclusionResult.data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSetLimit() {
    const value = parseFloat(limitValue);
    const days = parseInt(periodDays, 10);
    if (isNaN(value) || value <= 0 || isNaN(days) || days <= 0) return;

    const result = await setGamblingLimit({
      limitType,
      limitValue: value,
      periodDays: days,
    });
    if (result.success) {
      // Refresh limits
      const limitsResult = await getGamblingLimits();
      if (limitsResult.success) setLimits(limitsResult.data);
      setLimitValue("");
    }
  }

  async function handleSelfExclude() {
    if (!confirmExclude) {
      setConfirmExclude(true);
      return;
    }

    const result = await selfExclude({
      exclusionType: excludeType,
      durationDays: excludeType === "temporary" ? parseInt(excludeDays, 10) : undefined,
      reason: excludeReason || undefined,
    });
    if (result.success) {
      setExclusion(result.data);
      setConfirmExclude(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      {/* Active Exclusion Warning */}
      {exclusion && (
        <Card className="border-red-500/50 bg-red-950/20">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-red-400">
              {t("selfExclusionActive")}
            </h3>
            <p className="mt-1 text-sm text-red-300">
              {exclusion.exclusionType === "permanent"
                ? t("permanentExclusion")
                : t("temporaryExclusion", {
                    endDate: exclusion.endDate
                      ? new Date(exclusion.endDate).toLocaleDateString()
                      : "—",
                  })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Gambling Limits */}
      <Card>
        <CardHeader>
          <CardTitle>{t("gamblingLimits")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {limits.length > 0 && (
            <div className="space-y-2">
              {limits.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-purple-950/30 p-3"
                >
                  <div>
                    <span className="text-sm font-medium capitalize">
                      {l.limitType} limit
                    </span>
                    <span className="ml-2 text-xs text-purple-400">
                      ({l.periodDays} day{l.periodDays > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-yellow-400">
                      ${l.currentUsage.toFixed(2)}
                    </span>
                    <span className="text-purple-400">
                      {" "}
                      / ${l.limitValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                className="rounded-md border border-purple-800/30 bg-background px-3 py-2 text-sm"
                value={limitType}
                onChange={(e) =>
                  setLimitType(
                    e.target.value as "deposit" | "loss" | "session"
                  )
                }
              >
                <option value="loss">{t("lossLimit")}</option>
                <option value="deposit">{t("depositLimit")}</option>
                <option value="session">{t("sessionLimit")}</option>
              </select>
              <Input
                type="number"
                placeholder={t("limitAmount")}
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className="max-w-[120px]"
              />
              <Input
                type="number"
                placeholder={t("days")}
                value={periodDays}
                onChange={(e) => setPeriodDays(e.target.value)}
                className="max-w-[80px]"
              />
              <Button variant="outline" onClick={handleSetLimit}>
                {t("setLimit")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-Exclusion */}
      {!exclusion && (
        <Card className="border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-400">
              {t("selfExclusion")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-purple-300">
              {t("selfExclusionDescription")}
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <select
                  className="rounded-md border border-purple-800/30 bg-background px-3 py-2 text-sm"
                  value={excludeType}
                  onChange={(e) =>
                    setExcludeType(
                      e.target.value as "temporary" | "permanent"
                    )
                  }
                >
                  <option value="temporary">{t("temporary")}</option>
                  <option value="permanent">{t("permanent")}</option>
                </select>
                {excludeType === "temporary" && (
                  <Input
                    type="number"
                    placeholder={t("days")}
                    value={excludeDays}
                    onChange={(e) => setExcludeDays(e.target.value)}
                    className="max-w-[100px]"
                  />
                )}
              </div>
              <Input
                placeholder={t("reason")}
                value={excludeReason}
                onChange={(e) => setExcludeReason(e.target.value)}
              />
              <Button
                variant={confirmExclude ? "destructive" : "outline"}
                onClick={handleSelfExclude}
              >
                {confirmExclude ? t("confirmExclude") : t("selfExcludeButton")}
              </Button>
              {confirmExclude && (
                <p className="text-xs text-red-400">
                  {t("excludeWarning")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
