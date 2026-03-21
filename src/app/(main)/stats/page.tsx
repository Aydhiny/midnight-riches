"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { getStatsAction } from "@/server/actions/stats";
import { ArrowLeft, TrendingUp, Zap, Trophy, BarChart3, Target, Award } from "lucide-react";

interface Stats {
  totalSpins: number;
  totalWagered: number;
  totalWon: number;
  rtp: number;
  biggestWin: number;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-5 animate-pulse">
      <div className="mb-3 h-8 w-8 rounded-lg bg-white/10" />
      <div className="mb-1.5 h-8 w-24 rounded-lg bg-white/10" />
      <div className="h-3 w-16 rounded bg-white/8" />
    </div>
  );
}

function RtpMeter({ rtp, t }: { rtp: number; t: (key: string) => string }) {
  const clamped = Math.min(Math.max(rtp, 0), 150);
  const pct     = (clamped / 150) * 100;
  const color   = rtp >= 96 ? "#22c55e" : rtp >= 85 ? "#f59e0b" : "#ef4444";
  const label   = rtp >= 96 ? t("excellent") : rtp >= 85 ? t("average") : t("belowAverage");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">{t("yourRtp")}</span>
        <span className="font-bold tabular-nums" style={{ color }}>{rtp.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>0%</span>
        <span className="font-medium" style={{ color }}>{label}</span>
        <span>150%+</span>
      </div>
    </div>
  );
}

function AnimatedNumber({ value, prefix = "", suffix = "", decimals = 0 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start    = Date.now();
    const duration = 1000;
    const from     = 0;
    const to       = value;

    function update() {
      const elapsed  = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 4);
      setDisplayed(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }, [value]);

  const formatted = displayed.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <>{prefix}{formatted}{suffix}</>;
}

export default function StatsPage() {
  const t = useTranslations("stats");
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const STAT_CARDS = [
    {
      key: "totalSpins" as const,
      label: t("totalSpins"),
      icon: Zap,
      color: "#f59e0b",
      glow: "rgba(245,158,11,0.25)",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      prefix: "",
      suffix: "",
      decimals: 0,
    },
    {
      key: "totalWon" as const,
      label: t("totalWon"),
      icon: Trophy,
      color: "#22c55e",
      glow: "rgba(34,197,94,0.2)",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      prefix: "$",
      suffix: "",
      decimals: 2,
    },
    {
      key: "totalWagered" as const,
      label: t("totalWagered"),
      icon: BarChart3,
      color: "#7c3aed",
      glow: "rgba(124,58,237,0.2)",
      bg: "rgba(124,58,237,0.08)",
      border: "rgba(124,58,237,0.2)",
      prefix: "$",
      suffix: "",
      decimals: 2,
    },
    {
      key: "biggestWin" as const,
      label: t("biggestWin"),
      icon: Award,
      color: "#ec4899",
      glow: "rgba(236,72,153,0.2)",
      bg: "rgba(236,72,153,0.08)",
      border: "rgba(236,72,153,0.2)",
      prefix: "$",
      suffix: "",
      decimals: 2,
    },
  ];

  useEffect(() => {
    getStatsAction().then((res) => {
      if (res.success) setStats(res.stats);
      else setError(res.error);
      setLoading(false);
    });
  }, []);

  const winRate = stats
    ? stats.totalSpins > 0
      ? ((stats.totalWon > 0 ? 1 : 0) / stats.totalSpins) * 100
      : 0
    : 0;

  const netPnl       = stats ? stats.totalWon - stats.totalWagered : 0;
  const isProfitable = netPnl >= 0;

  return (
    <div
      className="relative mx-auto max-w-4xl px-4 py-8"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-amber-500/6 blur-3xl" />
      </div>

      {/* Back link */}
      <Link
        href="/game"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGame")}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400/70">
            {t("badge")}
          </span>
        </div>
        <h1
          className="text-4xl font-black tracking-tight"
          style={{
            backgroundImage: "linear-gradient(90deg, #fbbf24 0%, #fde68a 40%, #f59e0b 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {t("subtitle")}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stat grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : STAT_CARDS.map((card, i) => {
              const Icon  = card.icon;
              const value = stats?.[card.key] ?? 0;
              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border p-5"
                  style={{
                    background: card.bg,
                    borderColor: card.border,
                    boxShadow: `0 0 30px ${card.glow}`,
                  }}
                >
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${card.color}20`, border: `1px solid ${card.color}30` }}
                  >
                    <Icon className="h-4.5 w-4.5" style={{ color: card.color }} />
                  </div>
                  <div
                    className="text-3xl font-black tabular-nums leading-none"
                    style={{ color: card.color }}
                  >
                    <AnimatedNumber
                      value={value}
                      prefix={card.prefix}
                      suffix={card.suffix}
                      decimals={card.decimals}
                    />
                  </div>
                  <div className="mt-1.5 text-xs text-[var(--text-muted)]">{card.label}</div>
                </motion.div>
              );
            })}
      </div>

      {/* RTP + P/L row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* RTP Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 16 : 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-md"
        >
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {t("returnToPlayer")}
            </span>
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 w-full rounded bg-white/8" />
              <div className="h-2.5 w-full rounded-full bg-white/8" />
              <div className="flex justify-between">
                <div className="h-3 w-6 rounded bg-white/8" />
                <div className="h-3 w-16 rounded bg-white/8" />
                <div className="h-3 w-8 rounded bg-white/8" />
              </div>
            </div>
          ) : (
            <RtpMeter rtp={stats?.rtp ?? 0} t={t} />
          )}
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {t("houseEdgeNote")}
          </p>
        </motion.div>

        {/* Net P/L Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: loading ? 0 : 1, y: loading ? 16 : 0 }}
          transition={{ delay: 0.42 }}
          className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-md"
        >
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${isProfitable ? "text-emerald-400" : "text-red-400"}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {t("netProfitLoss")}
            </span>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-12 w-36 rounded-lg bg-white/8" />
              <div className="h-3 w-24 rounded bg-white/8" />
            </div>
          ) : (
            <>
              <div
                className="text-4xl font-black tabular-nums"
                style={{ color: isProfitable ? "#22c55e" : "#ef4444" }}
              >
                {isProfitable ? "+" : ""}
                <AnimatedNumber value={netPnl} prefix="$" decimals={2} />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {isProfitable ? t("aheadOfHouse") : t("roughStreak")}
              </p>

              {/* Win rate pill */}
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: isProfitable ? "#22c55e" : "#f59e0b" }}
                />
                <span className="text-xs text-[var(--text-secondary)]">
                  {t("winRate")}{" "}
                  <span className="font-bold text-[var(--text-primary)]">
                    {(stats?.totalSpins ?? 0) > 0
                      ? `${winRate.toFixed(1)}%`
                      : t("notApplicable")}
                  </span>
                </span>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Empty state */}
      {!loading && stats && stats.totalSpins === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex flex-col items-center gap-3 py-12 text-center"
        >
          <span className="text-5xl opacity-40">🎰</span>
          <p className="font-semibold text-[var(--text-secondary)]">{t("noSpinsYet")}</p>
          <p className="text-sm text-[var(--text-muted)]">{t("noSpinsDesc")}</p>
          <Link
            href="/game"
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-bold text-black transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
              boxShadow: "0 0 20px rgba(245,158,11,0.35)",
            }}
          >
            🎰 {t("playNow")}
          </Link>
        </motion.div>
      )}
    </div>
  );
}
