"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
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

type Tab = "profile" | "preferences" | "security";

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { data: session } = useSession();
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security & Limits",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("title")}</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-purple-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab session={session} />}
      {tab === "preferences" && <PreferencesTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}

function ProfileTab({ session }: { session: ReturnType<typeof useSession>["data"] }) {
  return (
    <div className="space-y-4">
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shrink-0">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="Profile" className="h-full w-full rounded-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {(session?.user?.name ?? session?.user?.email ?? "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{session?.user?.name ?? "Player"}</p>
              <p className="text-sm text-[var(--text-muted)]">{session?.user?.email}</p>
            </div>
          </div>

          <div className="grid gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Display Name</label>
              <Input defaultValue={session?.user?.name ?? ""} className="mt-1" placeholder="Your display name" />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Email</label>
              <Input defaultValue={session?.user?.email ?? ""} disabled className="mt-1 opacity-60" />
            </div>
          </div>

          <Button variant="outline" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Player Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">0</div>
              <div className="text-xs text-[var(--text-muted)]">Total Spins</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">$0</div>
              <div className="text-xs text-[var(--text-muted)]">Total Won</div>
            </div>
            <div>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">0</div>
              <div className="text-xs text-[var(--text-muted)]">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Game Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Sound Effects</p>
              <p className="text-xs text-[var(--text-muted)]">Play sounds during spins and wins</p>
            </div>
            <Button variant="outline" size="sm" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              On
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Animations</p>
              <p className="text-xs text-[var(--text-muted)]">Show visual effects and transitions</p>
            </div>
            <Button variant="outline" size="sm" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              On
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Auto-save Turbo Mode</p>
              <p className="text-xs text-[var(--text-muted)]">Remember turbo mode between sessions</p>
            </div>
            <Button variant="outline" size="sm" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              Off
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Daily Bonus Reminders</p>
              <p className="text-xs text-[var(--text-muted)]">Get notified when bonus is available</p>
            </div>
            <Button variant="outline" size="sm" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              On
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Jackpot Alerts</p>
              <p className="text-xs text-[var(--text-muted)]">Notify when jackpot reaches high amounts</p>
            </div>
            <Button variant="outline" size="sm" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
              On
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const t = useTranslations("settings");
  const [limits, setLimits] = useState<GamblingLimit[]>([]);
  const [exclusion, setExclusion] = useState<SelfExclusion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    <div className="space-y-4">
      {/* Password Section */}
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" placeholder="Current password" />
          <Input type="password" placeholder="New password" />
          <Input type="password" placeholder="Confirm new password" />
          <Button variant="outline" className="border-[var(--glass-border)] text-[var(--text-secondary)]">
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Active Exclusion Warning */}
      {exclusion && (
        <Card className="border-red-500/30 bg-red-50 dark:bg-red-950/20 dark:border-red-500/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400">
              {t("selfExclusionActive")}
            </h3>
            <p className="mt-1 text-sm text-red-500 dark:text-red-300">
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
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">{t("gamblingLimits")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {limits.length > 0 && (
            <div className="space-y-2">
              {limits.map((l, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3"
                >
                  <div>
                    <span className="text-sm font-medium capitalize text-[var(--text-primary)]">
                      {l.limitType} limit
                    </span>
                    <span className="ml-2 text-xs text-purple-600 dark:text-purple-400">
                      ({l.periodDays} day{l.periodDays > 1 ? "s" : ""})
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-amber-600 dark:text-yellow-400">
                      ${l.currentUsage.toFixed(2)}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {" "}/ ${l.limitValue.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select
                className="rounded-md border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                value={limitType}
                onChange={(e) =>
                  setLimitType(e.target.value as "deposit" | "loss" | "session")
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
              <Button variant="outline" onClick={handleSetLimit} className="border-[var(--glass-border)] text-[var(--text-secondary)]">
                {t("setLimit")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Self-Exclusion — collapsed by default */}
      {!exclusion && (
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showAdvanced ? "▾" : "▸"} Advanced options
          </button>
          {showAdvanced && (
            <Card className="mt-2 border-orange-300/30 dark:border-orange-500/30 bg-[var(--bg-card)]">
              <CardHeader>
                <CardTitle className="text-sm text-orange-600 dark:text-orange-400">
                  {t("selfExclusion")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[var(--text-muted)]">
                  {t("selfExclusionDescription")}
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <select
                      className="rounded-md border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)]"
                      value={excludeType}
                      onChange={(e) =>
                        setExcludeType(e.target.value as "temporary" | "permanent")
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
                    size="sm"
                    onClick={handleSelfExclude}
                    className={confirmExclude ? "" : "border-[var(--glass-border)] text-[var(--text-secondary)]"}
                  >
                    {confirmExclude ? t("confirmExclude") : t("selfExcludeButton")}
                  </Button>
                  {confirmExclude && (
                    <p className="text-xs text-red-500 dark:text-red-400">
                      {t("excludeWarning")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
