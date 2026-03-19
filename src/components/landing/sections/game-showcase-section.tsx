"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type LucideIcon, Star, Zap, Layers, Shuffle } from "lucide-react";
import { SectionHeadline } from "../ui/glass";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";
import { motion } from "framer-motion";

// ── Keyframes injected once ───────────────────────────────────────────────────
const SHOWCASE_CSS = `
  @keyframes neon-pulse {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 1;    }
  }
  @keyframes badge-glow {
    0%, 100% { box-shadow: 0 0 6px currentColor; }
    50%       { box-shadow: 0 0 14px currentColor, 0 0 28px currentColor; }
  }
`;

// ── Game data ─────────────────────────────────────────────────────────────────
const GAMES: {
  id: string;
  glowColor: string;
  glowRgb: string;
  icon: LucideIcon;
  rtp: string;
  thumbnail: string;
  basePlayers: number;
  badge?: { label: string; color: string };
}[] = [
  {
    id: "classic",
    glowColor: "#f59e0b",
    glowRgb: "245,158,11",
    icon: Star,
    rtp: "96.5%",
    thumbnail: "/images/classic-slots.jpg",
    basePlayers: 248,
    badge: { label: "🔥 HOT", color: "bg-orange-500/30 text-orange-300 border-orange-400/40" },
  },
  {
    id: "fiveReel",
    glowColor: "#8b5cf6",
    glowRgb: "139,92,246",
    icon: Zap,
    rtp: "97.1%",
    thumbnail: "/images/five-reel-deluxe.png",
    basePlayers: 182,
  },
  {
    id: "cascade",
    glowColor: "#10b981",
    glowRgb: "16,185,129",
    icon: Layers,
    rtp: "97.3%",
    thumbnail: "/images/cascading-reels.png",
    basePlayers: 94,
    badge: { label: "✨ NEW", color: "bg-emerald-500/30 text-emerald-300 border-emerald-400/40" },
  },
  {
    id: "megaways",
    glowColor: "#ec4899",
    glowRgb: "236,72,153",
    icon: Shuffle,
    rtp: "96.8%",
    thumbnail: "/images/megaways.jpg",
    basePlayers: 319,
  },
];

// ── Section ───────────────────────────────────────────────────────────────────
export function GameShowcaseSection() {
  const t = useTranslations("landing.games");
  const { track } = useConversionTracker();

  return (
    <section id="games" className="relative py-20 md:py-28">
      <style>{SHOWCASE_CSS}</style>

      {/* Ambient background bloom */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeadline sub={t("subheadline")}>{t("headline")}</SectionHeadline>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
          {GAMES.map((game, i) => (
            <ScrollReveal key={game.id} delay={i * 0.08}>
              <GameCard
                game={game}
                onPlay={() => track("cta_click", { section: "games", game: game.id })}
                t={t}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Bottom ticker line */}
        <ScrollReveal delay={0.35}>
          <div className="mt-8 flex items-center justify-center gap-6 text-[10px] text-[var(--text-muted)] uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live multiplayer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Instant payouts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
              Provably fair
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function GameCard({
  game,
  onPlay,
  t,
}: {
  game: (typeof GAMES)[number];
  onPlay: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  // Fluctuating live player count
  const [players, setPlayers] = useState(game.basePlayers);

  useEffect(() => {
    const id = setInterval(() => {
      setPlayers((p) => Math.max(10, p + Math.floor(Math.random() * 7) - 3));
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl"
      whileHover={{ scale: 1.03, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      style={{ boxShadow: `0 0 0 1px rgba(${game.glowRgb},0.2)` }}
    >
      {/* Hover neon border overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: `0 0 0 1.5px rgba(${game.glowRgb},0.9), 0 0 28px 2px rgba(${game.glowRgb},0.35), inset 0 0 24px 1px rgba(${game.glowRgb},0.06)`,
        }}
      />

      {/* Always-on subtle neon edge (pulsing) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: `0 0 0 1px rgba(${game.glowRgb},0.35)`,
          animation: "neon-pulse 3s ease-in-out infinite",
        }}
      />

      {/* Background image + gradients */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.thumbnail}
          alt={t(`${game.id}.name`)}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          style={{ filter: "brightness(0.45) saturate(1.5)" }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.90) 100%)",
          }}
        />
        {/* Color bloom on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, rgba(${game.glowRgb},0.7) 0%, transparent 65%)`,
          }}
        />
      </div>

      {/* Top-right: badge */}
      {game.badge && (
        <div className="absolute right-2.5 top-2.5 z-10">
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${game.badge.color}`}
            style={{ animation: "badge-glow 2.5s ease-in-out infinite" }}
          >
            {game.badge.label}
          </span>
        </div>
      )}

      {/* Top-left: RTP chip */}
      <div className="absolute left-2.5 top-2.5 z-10">
        <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] font-bold text-emerald-400 backdrop-blur-sm">
          {game.rtp} RTP
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
        {/* Live player count */}
        <div className="mb-2 flex items-center gap-1">
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[9px] font-semibold text-emerald-400">
            {players.toLocaleString()} playing now
          </span>
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <h3 className="text-sm font-black text-white leading-tight">
            {t(`${game.id}.name`)}
          </h3>
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{
              background: `rgba(${game.glowRgb},0.25)`,
              border: `1px solid rgba(${game.glowRgb},0.55)`,
              boxShadow: `0 0 8px rgba(${game.glowRgb},0.35)`,
            }}
          >
            <game.icon className="h-3 w-3" style={{ color: game.glowColor }} />
          </div>
        </div>

        {/* Play button */}
        <Link
          href="/game"
          onClick={onPlay}
          className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-xl py-2.5 text-xs font-black text-white transition-all duration-200 group-hover:brightness-115 active:scale-95"
          style={{
            background: `linear-gradient(135deg, rgba(${game.glowRgb},0.85), rgba(${game.glowRgb},0.55))`,
            border: `1px solid rgba(${game.glowRgb},0.6)`,
            boxShadow: `0 0 12px rgba(${game.glowRgb},0.25), inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
        >
          {/* Inner shimmer on hover */}
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 5v14l11-7z"/>
          </svg>
          {t("playNow")}
        </Link>
      </div>
    </motion.div>
  );
}
