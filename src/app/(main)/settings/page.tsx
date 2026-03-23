"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
import { updateProfileAction } from "@/server/actions/profile";
import { getPlayerStatsAction } from "@/server/actions/stats";
import { ReferralSection } from "@/components/settings/referral-section";
import { TwoFactorSection } from "@/components/settings/two-factor-section";
import type { GamblingLimit, SelfExclusion } from "@/types";
import { Camera, Check, ChevronDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Tab = "profile" | "preferences" | "security" | "referral";

interface CustomSelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  variant?: "default" | "danger";
}

function CustomSelect({ value, onChange, options, variant = "default" }: CustomSelectProps) {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const isDefault = variant === "default";

  const triggerClass = isDefault
    ? "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)]"
    : "border-red-900/30 bg-red-950/20 text-red-300";

  const dropdownClass = isDefault
    ? "border-[var(--glass-border)] bg-[var(--bg-card)]"
    : "border-red-900/30 bg-[#1a0505]";

  const itemHoverClass = isDefault
    ? "hover:bg-violet-600/15 hover:text-[var(--text-primary)]"
    : "hover:bg-red-900/20 hover:text-red-200";

  const checkClass = isDefault ? "text-violet-400" : "text-red-400";

  const headerClass = isDefault
    ? "text-[var(--text-muted)]"
    : "text-red-400/60";

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${triggerClass}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border shadow-lg ${dropdownClass}`}
          >
            <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${headerClass}`}>
              {t("selectOption")}
            </div>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                  opt.value === value
                    ? isDefault
                      ? "text-violet-400 bg-violet-600/10"
                      : "text-red-400 bg-red-900/20"
                    : isDefault
                    ? "text-[var(--text-secondary)]"
                    : "text-red-300/80"
                } ${itemHoverClass}`}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check className={`h-3.5 w-3.5 ${checkClass}`} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
        checked ? "bg-violet-600" : "bg-[var(--glass-border)]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const { data: session, update: updateSession } = useSession();
  const [tab, setTab] = useState<Tab>("profile");

  const tabs: { id: Tab; label: string }[] = [
    { id: "profile",     label: t("profile")     },
    { id: "preferences", label: t("preferences") },
    { id: "security",    label: t("security")    },
    { id: "referral",    label: t("referral.tab") },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 pb-12">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{t("title")}</h1>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 sm:grid-cols-4">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`rounded-lg px-3 py-2 text-center text-xs font-medium transition-all sm:px-4 sm:text-sm ${
              tab === tb.id
                ? "bg-violet-600 text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "profile"     && <ProfileTab session={session} updateSession={updateSession} />}
      {tab === "preferences" && <PreferencesTab />}
      {tab === "security"    && <SecurityTab />}
      {tab === "referral"    && <ReferralSection />}
    </div>
  );
}

function ProfileTab({
  session,
  updateSession,
}: {
  session: ReturnType<typeof useSession>["data"];
  updateSession: ReturnType<typeof useSession>["update"];
}) {
  const t = useTranslations("settings");
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(session?.user?.image ?? null);
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  // Player stats
  const [playerStats, setPlayerStats] = useState<{ totalSpins: number; totalWon: number; achievements: number } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getPlayerStatsAction().then((res) => {
      if (res.success) setPlayerStats(res.data);
      setStatsLoading(false);
    });
  }, []);

  useEffect(() => {
    setName(session?.user?.name ?? "");
    setAvatarPreview(session?.user?.image ?? null);
  }, [session]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarData(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfileAction({
        name: name || undefined,
        image: avatarData || undefined,
      });
      if (result.success) {
        // Store a cache-busted URL in the JWT (not base64 — 4 KB cookie limit)
        const avatarUrl = avatarData
          ? `/api/profile/avatar?t=${Date.now()}`
          : (avatarPreview ?? undefined);
        await updateSession({ name, image: avatarUrl });
        if (avatarData) setAvatarPreview(avatarUrl ?? null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setAvatarData(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">{t("profileInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center overflow-hidden ring-2 ring-violet-500/30">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <Image src="/images/profile-pic.webp" alt="Profile" width={80} height={80} className="h-full w-full object-cover" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-lg hover:text-violet-400 hover:border-violet-400/50 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{session?.user?.name ?? "Player"}</p>
              <p className="text-sm text-[var(--text-muted)]">{session?.user?.email}</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                {t("changePhoto")}
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{t("profileTab.name")}</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
                placeholder={t("profileTab.namePlaceholder")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{t("profileTab.email")}</label>
              <Input
                defaultValue={session?.user?.email ?? ""}
                disabled
                className="mt-1.5 opacity-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">{t("emailCannotChange")}</p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("saving")}</>
            ) : saved ? (
              <><Check className="h-4 w-4" /> {t("saved")}</>
            ) : (
              t("profileTab.saveChanges")
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader>
          <CardTitle className="text-[var(--text-primary)]">{t("playerStats")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
            {[
              {
                label: t("playerStatSpins"),
                value: statsLoading ? "—" : playerStats?.totalSpins.toLocaleString() ?? "0",
                color: "text-amber-400",
              },
              {
                label: t("playerStatWon"),
                value: statsLoading ? "—" : `$${(playerStats?.totalWon ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                color: "text-emerald-400",
              },
              {
                label: t("playerStatAchievements"),
                value: statsLoading ? "—" : playerStats?.achievements.toLocaleString() ?? "0",
                color: "text-violet-400",
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3">
                <div className={`text-lg sm:text-2xl font-black ${color} ${statsLoading ? "animate-pulse" : ""}`}>{value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesTab() {
  const t = useTranslations("settings");
  const [sounds,        setSounds]        = useState(() => localStorage.getItem("pref_sounds")        !== "false");
  const [animations,   setAnimations]    = useState(() => localStorage.getItem("pref_animations")    !== "false");
  const [turbo,         setTurbo]         = useState(() => localStorage.getItem("pref_turbo")         === "true");
  const [dailyBonus,   setDailyBonus]    = useState(() => localStorage.getItem("pref_dailyBonus")    !== "false");
  const [jackpotAlerts, setJackpotAlerts] = useState(() => localStorage.getItem("pref_jackpotAlerts") !== "false");

  function persist(key: string, value: boolean) {
    localStorage.setItem(key, String(value));
    if (key === "pref_sounds") {
      localStorage.setItem("mr_sfx_enabled", String(value));
      window.dispatchEvent(new StorageEvent("storage", { key: "mr_sfx_enabled", newValue: String(value) }));
    }
  }

  const prefRows: { label: string; sub: string; key: string; value: boolean; set: (v: boolean) => void }[] = [
    { label: t("soundEffects"),  sub: t("soundEffectsDesc"),        key: "pref_sounds",      value: sounds,      set: setSounds      },
    { label: t("animations"),    sub: t("animationsDesc"),           key: "pref_animations",  value: animations,  set: setAnimations  },
    { label: t("turboMode"),     sub: t("turboModeDesc"),            key: "pref_turbo",       value: turbo,       set: setTurbo       },
  ];
  const notifRows: { label: string; sub: string; key: string; value: boolean; set: (v: boolean) => void }[] = [
    { label: t("dailyBonusReminders"), sub: t("dailyBonusRemindersDesc"), key: "pref_dailyBonus",    value: dailyBonus,    set: setDailyBonus    },
    { label: t("jackpotAlerts"),        sub: t("jackpotAlertsDesc"),        key: "pref_jackpotAlerts", value: jackpotAlerts, set: setJackpotAlerts },
  ];

  return (
    <div className="space-y-4">
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader><CardTitle className="text-[var(--text-primary)]">{t("gamePreferences")}</CardTitle></CardHeader>
        <CardContent className="divide-y divide-[var(--glass-border)]">
          {prefRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{row.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.sub}</p>
              </div>
              <Toggle
                checked={row.value}
                onChange={(v) => { row.set(v); persist(row.key, v); }}
                label={row.label}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader><CardTitle className="text-[var(--text-primary)]">{t("preferencesTab.notifications")}</CardTitle></CardHeader>
        <CardContent className="divide-y divide-[var(--glass-border)]">
          {notifRows.map((row) => (
            <div key={row.key} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{row.label}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.sub}</p>
              </div>
              <Toggle
                checked={row.value}
                onChange={(v) => { row.set(v); persist(row.key, v); }}
                label={row.label}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const t = useTranslations("settings");
  return (
    <div className="space-y-6">
      {/* 2FA */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("twoFactorAuth")}</h2>
        <TwoFactorSection />
      </div>
      <div className="h-px bg-[var(--glass-border)]" />
      {/* Responsible gambling */}
      <SecurityTabContent />
    </div>
  );
}

function SecurityTabContent() {
  const t = useTranslations("settings");
  const [limits, setLimits] = useState<GamblingLimit[]>([]);
  const [exclusion, setExclusion] = useState<SelfExclusion | null>(null);
  const [newLimit, setNewLimit] = useState<{ type: GamblingLimit["limitType"]; amount: string }>({
    type: "loss",
    amount: "",
  });
  const [exclusionDays, setExclusionDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getGamblingLimits(), getExclusionStatus()]).then(([limitsResult, exclusionResult]) => {
      if (limitsResult.success) setLimits(limitsResult.data);
      if (exclusionResult.success) setExclusion(exclusionResult.data);
      setLoading(false);
    });
  }, []);

  async function handleSetLimit() {
    const amount = parseFloat(newLimit.amount);
    if (isNaN(amount) || amount <= 0) return;
    await setGamblingLimit({ limitType: newLimit.type, limitValue: amount, periodDays: 1 });
    const updated = await getGamblingLimits();
    if (updated.success) setLimits(updated.data);
    setNewLimit((prev) => ({ ...prev, amount: "" }));
  }

  async function handleSelfExclude() {
    if (!confirm(t("selfExcludeConfirm", { days: exclusionDays }))) return;
    await selfExclude({ exclusionType: "temporary", durationDays: exclusionDays, reason: "voluntary" });
    const updated = await getExclusionStatus();
    if (updated.success) setExclusion(updated.data);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" /></div>;

  return (
    <div className="space-y-4">
      <Card className="bg-[var(--bg-card)] border-[var(--glass-border)]">
        <CardHeader><CardTitle className="text-[var(--text-primary)]">{t("gamblingLimits")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {limits.length > 0 && (
            <div className="space-y-2">
              {limits.map((limit, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2.5">
                  <span className="text-sm text-[var(--text-secondary)] capitalize">{limit.limitType.replace("_", " ")} {t("limitSuffix")}</span>
                  <span className="text-sm font-bold text-amber-400">${limit.limitValue}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <CustomSelect
              value={newLimit.type}
              onChange={(v) => setNewLimit((p) => ({ ...p, type: v as GamblingLimit["limitType"] }))}
              options={[
                { value: "loss",    label: t("lossLimit")    },
                { value: "deposit", label: t("depositLimit") },
                { value: "session", label: t("sessionLimit") },
              ]}
              variant="default"
            />
            <Input
              type="number"
              placeholder={t("limitAmount")}
              value={newLimit.amount}
              onChange={(e) => setNewLimit((p) => ({ ...p, amount: e.target.value }))}
              className="w-24 min-w-0"
            />
            <Button onClick={handleSetLimit} className="bg-violet-600 hover:bg-violet-700 text-white">{t("setLimit")}</Button>
          </div>
        </CardContent>
      </Card>

      {!exclusion && (
        <details className="rounded-xl border border-red-900/30 bg-red-950/10">
          <summary className="cursor-pointer px-4 py-3 text-xs text-red-400/60 hover:text-red-400 transition-colors list-none">
            ⚠ {t("selfExclusion")} — {t("selfExclusionSupportHint")}
          </summary>
          <div className="px-4 pb-4 pt-2 space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              {t("selfExclusionDescription")}
            </p>
            <div className="flex flex-wrap gap-2">
              <CustomSelect
                value={String(exclusionDays)}
                onChange={(v) => setExclusionDays(Number(v))}
                options={[7, 30, 90, 180, 365].map((d) => ({ value: String(d), label: `${d} ${t("days")}` }))}
                variant="danger"
              />
              <Button
                onClick={handleSelfExclude}
                variant="outline"
                className="border-red-900/40 text-red-400 hover:bg-red-950/40"
              >
                {t("selfExcludeAction")}
              </Button>
            </div>
          </div>
        </details>
      )}

      {exclusion && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4">
          <p className="text-sm font-medium text-red-400">{t("selfExclusionActive")}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {exclusion.endDate
              ? `Your account is excluded until ${new Date(exclusion.endDate).toLocaleDateString()}.`
              : "Your account is permanently excluded."}
          </p>
        </div>
      )}
    </div>
  );
}
