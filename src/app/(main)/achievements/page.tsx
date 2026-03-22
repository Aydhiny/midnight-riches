"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { ArrowLeft, Lock, Trophy, Star } from "lucide-react";
import {
  ACHIEVEMENTS,
  RARITY_COLORS,
  RARITY_GLOW,
  type Achievement,
} from "@/lib/game/achievements";
import { getUserAchievementsAction } from "@/server/actions/achievements";

// ─── CSS injected for shimmer/pulse ───────────────────────────────────────────
const ACHIEVEMENTS_CSS = `
@keyframes legendaryShimmer {
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
}
@keyframes achievementPulse {
  0%,100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.3), 0 4px 30px rgba(251,191,36,0.1); }
  50%     { box-shadow: 0 0 0 1.5px rgba(251,191,36,0.65), 0 4px 50px rgba(251,191,36,0.25); }
}
.legendary-achievement-pulse { animation: achievementPulse 2.8s ease-in-out infinite; }
.legendary-shimmer-text {
  background: linear-gradient(90deg, #fbbf24 0%, #fde68a 30%, #fff9c4 50%, #fde68a 70%, #f59e0b 100%);
  background-size: 300% 100%;
  animation: legendaryShimmer 3s linear infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gold-bar {
  background: linear-gradient(90deg, transparent, rgba(251,191,36,0.85), rgba(255,255,255,0.9), rgba(251,191,36,0.85), transparent);
  background-size: 200% 100%;
  animation: legendaryShimmer 2.4s linear infinite;
}
`;

// ─── Rarity tab config ─────────────────────────────────────────────────────────
type RarityFilter = "all" | Achievement["rarity"];

interface RarityTabConfig {
  key: RarityFilter;
  labelKey: string;
  color: string;
  activeBg: string;
  activeBorder: string;
}

const RARITY_TABS: RarityTabConfig[] = [
  {
    key: "all",
    labelKey: "filterAll",
    color: "#a78bfa",
    activeBg: "rgba(167,139,250,0.12)",
    activeBorder: "rgba(167,139,250,0.5)",
  },
  {
    key: "common",
    labelKey: "filterCommon",
    color: "#9ca3af",
    activeBg: "rgba(156,163,175,0.12)",
    activeBorder: "rgba(156,163,175,0.45)",
  },
  {
    key: "rare",
    labelKey: "filterRare",
    color: "#818cf8",
    activeBg: "rgba(139,92,246,0.12)",
    activeBorder: "rgba(139,92,246,0.5)",
  },
  {
    key: "epic",
    labelKey: "filterEpic",
    color: "#ec4899",
    activeBg: "rgba(236,72,153,0.12)",
    activeBorder: "rgba(236,72,153,0.5)",
  },
  {
    key: "legendary",
    labelKey: "filterLegendary",
    color: "#fbbf24",
    activeBg: "rgba(251,191,36,0.12)",
    activeBorder: "rgba(251,191,36,0.5)",
  },
];

// ─── Skeleton card ─────────────────────────────────────────────────────────────
function AchievementCardSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl border border-white/[0.06] p-5"
      style={{ background: "var(--bg-card)" }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="h-14 w-14 rounded-xl bg-white/10" />
        <div className="h-5 w-16 rounded-full bg-white/8" />
      </div>
      <div className="mb-1 h-5 w-32 rounded-lg bg-white/10" />
      <div className="mb-3 h-3 w-full rounded bg-white/6" />
      <div className="h-3 w-24 rounded bg-white/6" />
    </div>
  );
}

// ─── Individual achievement card ───────────────────────────────────────────────
function AchievementCard({
  achievement,
  isUnlocked,
  index,
  t,
}: {
  achievement: Achievement;
  isUnlocked: boolean;
  index: number;
  t: (key: string) => string;
}) {
  const isLegendary = achievement.rarity === "legendary";
  const gradientClass = RARITY_COLORS[achievement.rarity];
  const glowColor = RARITY_GLOW[achievement.rarity];

  const rarityLabel =
    achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1);

  const rarityStars =
    achievement.rarity === "common"
      ? "★"
      : achievement.rarity === "rare"
        ? "★★"
        : achievement.rarity === "epic"
          ? "★★★"
          : "★★★★";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.055, duration: 0.3, ease: "easeOut" }}
      whileHover={isUnlocked ? { y: -4, transition: { duration: 0.18 } } : undefined}
      className={`relative flex flex-col overflow-hidden rounded-2xl border transition-shadow duration-300 ${
        isLegendary && isUnlocked ? "legendary-achievement-pulse" : ""
      }`}
      style={{
        background: "var(--bg-card)",
        borderColor: isUnlocked ? glowColor.replace("0.4", "0.35").replace("0.5", "0.45") : "rgba(255,255,255,0.06)",
        boxShadow: isUnlocked && !isLegendary ? `0 0 24px ${glowColor}` : undefined,
        filter: isUnlocked ? "none" : "grayscale(0.85) brightness(0.55)",
        opacity: isUnlocked ? 1 : 0.75,
      }}
    >
      {/* Legendary shimmer bar */}
      {isLegendary && isUnlocked && (
        <div className="gold-bar absolute inset-x-0 top-0 h-[2px]" />
      )}

      {/* Locked overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 bg-black/30 backdrop-blur-[1px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
            <Lock className="h-5 w-5 text-white/50" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {t("locked")}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Icon + rarity badge row */}
        <div className="mb-4 flex items-start justify-between gap-2">
          {/* Big emoji icon */}
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-3xl ${
              isUnlocked
                ? `bg-gradient-to-br ${gradientClass}`
                : "bg-white/8"
            }`}
            style={
              isUnlocked
                ? { boxShadow: `0 0 20px ${glowColor}` }
                : undefined
            }
          >
            {isUnlocked ? achievement.icon : "❓"}
          </div>

          {/* Rarity badge */}
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={
              isUnlocked
                ? {
                    background:
                      achievement.rarity === "legendary"
                        ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                        : achievement.rarity === "epic"
                          ? "rgba(236,72,153,0.2)"
                          : achievement.rarity === "rare"
                            ? "rgba(139,92,246,0.2)"
                            : "rgba(156,163,175,0.2)",
                    color:
                      achievement.rarity === "legendary"
                        ? "#451a03"
                        : achievement.rarity === "epic"
                          ? "#f9a8d4"
                          : achievement.rarity === "rare"
                            ? "#c4b5fd"
                            : "#d1d5db",
                    border: `1px solid ${glowColor}`,
                  }
                : {
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.25)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }
            }
          >
            {rarityStars} {rarityLabel}
          </span>
        </div>

        {/* Title */}
        {isUnlocked && isLegendary ? (
          <h3 className="legendary-shimmer-text mb-1 text-base font-black leading-tight">
            {achievement.title}
          </h3>
        ) : (
          <h3
            className="mb-1 text-base font-bold leading-tight"
            style={{ color: isUnlocked ? "var(--text-primary)" : "rgba(255,255,255,0.3)" }}
          >
            {isUnlocked ? achievement.title : "???"}
          </h3>
        )}

        {/* Description */}
        <p className="mb-4 text-xs leading-relaxed text-[var(--text-muted)]">
          {isUnlocked ? achievement.description : "???"}
        </p>

        {/* XP pill */}
        <div className="flex items-center gap-1.5">
          <Star
            className="h-3.5 w-3.5"
            style={{ color: isUnlocked ? "#fbbf24" : "rgba(255,255,255,0.2)" }}
          />
          <span
            className="text-xs font-bold tabular-nums"
            style={{ color: isUnlocked ? "#fbbf24" : "rgba(255,255,255,0.2)" }}
          >
            +{achievement.xp} XP
          </span>
        </div>
      </div>

      {/* Unlocked bottom accent */}
      {isUnlocked && (
        <div
          className={`mt-auto h-[2px] w-full bg-gradient-to-r ${gradientClass} opacity-60`}
        />
      )}
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AchievementsPage() {
  const t = useTranslations("achievements");

  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading]         = useState(true);
  const [activeFilter, setActiveFilter] = useState<RarityFilter>("all");

  useEffect(() => {
    getUserAchievementsAction().then(({ unlocked }) => {
      setUnlockedIds(new Set(unlocked));
      setLoading(false);
    });
  }, []);

  // Derived stats
  const unlockedCount = unlockedIds.size;
  const totalCount    = ACHIEVEMENTS.length;
  const progressPct   = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const totalXpEarned = ACHIEVEMENTS.filter((a) => unlockedIds.has(a.id)).reduce(
    (sum, a) => sum + a.xp,
    0
  );
  const totalXpPossible = ACHIEVEMENTS.reduce((sum, a) => sum + a.xp, 0);

  const filteredAchievements =
    activeFilter === "all"
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.rarity === activeFilter);

  return (
    <div
      className="relative mx-auto max-w-5xl px-4 py-8"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      <style>{ACHIEVEMENTS_CSS}</style>

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-pink-600/5 blur-3xl" />
      </div>

      {/* Back link */}
      <Link
        href="/game"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGame")}
      </Link>

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="mb-1.5 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
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
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("subtitle")}</p>
      </div>

      {/* ── Progress panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-md"
      >
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Unlocked count */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {t("progress")}
            </div>
            {loading ? (
              <div className="mt-1 h-9 w-32 animate-pulse rounded-lg bg-white/10" />
            ) : (
              <div className="mt-1 text-3xl font-black tabular-nums text-[var(--text-primary)]">
                <span style={{ color: "#fbbf24" }}>{unlockedCount}</span>
                <span className="text-[var(--text-muted)]"> / {totalCount}</span>
                <span className="ml-2 text-sm font-medium text-[var(--text-muted)]">
                  {t("unlocked")}
                </span>
              </div>
            )}
          </div>

          {/* XP earned */}
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/8 px-5 py-3">
            <Star className="h-5 w-5 text-amber-400" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">
                {t("xpEarned")}
              </div>
              {loading ? (
                <div className="mt-0.5 h-6 w-20 animate-pulse rounded bg-white/10" />
              ) : (
                <div className="text-xl font-black tabular-nums text-amber-400">
                  {totalXpEarned.toLocaleString()}
                  <span className="ml-1 text-xs font-medium text-amber-400/50">
                    / {totalXpPossible.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 overflow-hidden rounded-full bg-white/8">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: loading ? "0%" : `${progressPct}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #7c3aed, #a855f7, #fbbf24)",
              boxShadow: "0 0 12px rgba(168,85,247,0.5)",
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>0</span>
          <span className="font-medium text-violet-400">{Math.round(progressPct)}%</span>
          <span>{totalCount}</span>
        </div>
      </motion.div>

      {/* ── Filter tabs ── */}
      <div className="mb-6 flex flex-wrap gap-2">
        {RARITY_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200"
              style={
                isActive
                  ? {
                      background: tab.activeBg,
                      borderColor: tab.activeBorder,
                      color: tab.color,
                      boxShadow: `0 0 16px ${tab.activeBg}`,
                    }
                  : {
                      background: "var(--glass-bg)",
                      borderColor: "var(--glass-border)",
                      color: "var(--text-muted)",
                    }
              }
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* ── Achievement grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <AchievementCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {filteredAchievements.map((achievement, i) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                isUnlocked={unlockedIds.has(achievement.id)}
                index={i}
                t={t}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Empty state (no achievements in filtered rarity) */}
      {!loading && filteredAchievements.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-5xl opacity-30">🏆</span>
          <p className="text-sm text-[var(--text-muted)]">{t("noAchievements")}</p>
        </div>
      )}
    </div>
  );
}
