"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { type LucideIcon, Star, Zap, Layers, Shuffle } from "lucide-react";
import { SectionHeadline } from "../ui/glass";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";
import { motion } from "framer-motion";

// Left/right floating symbols decorating the section edges
const LEFT_SYMBOLS = [
  { src: "/images/Cherry.png",     top: "8%",  size: 72, rotate: -22, opacity: 0.55, delay: 0    },
  { src: "/images/Lemon.png",      top: "26%", size: 58, rotate:  14, opacity: 0.45, delay: 0.6  },
  { src: "/images/Watermelon.png", top: "44%", size: 80, rotate:  -8, opacity: 0.52, delay: 1.2  },
  { src: "/images/Orange.png",     top: "62%", size: 62, rotate:  28, opacity: 0.46, delay: 1.8  },
  { src: "/images/Bell.png",       top: "79%", size: 68, rotate: -15, opacity: 0.50, delay: 2.4  },
  { src: "/images/Grape.png",      top: "92%", size: 54, rotate:  10, opacity: 0.40, delay: 3.0  },
];
const RIGHT_SYMBOLS = [
  { src: "/images/Star.png",       top: "5%",  size: 68, rotate:  32, opacity: 0.50, delay: 0.3  },
  { src: "/images/Diamond.png",    top: "22%", size: 60, rotate: -20, opacity: 0.46, delay: 0.9  },
  { src: "/images/Seven.png",      top: "40%", size: 76, rotate:  10, opacity: 0.53, delay: 1.5  },
  { src: "/images/Wild.png",       top: "58%", size: 64, rotate: -28, opacity: 0.46, delay: 2.1  },
  { src: "/images/Bar.png",        top: "75%", size: 70, rotate:  18, opacity: 0.48, delay: 2.7  },
  { src: "/images/Cherry.png",     top: "90%", size: 52, rotate:  -6, opacity: 0.38, delay: 3.3  },
];

const GAMES: {
  id: string;
  glowColor: string;
  glowRgb: string;
  stats: string[];
  features: string[];
  icon: LucideIcon;
  rtp: string;
  thumbnail: string;
  badge?: { label: string; color: string };
  description: string;
}[] = [
  {
    id: "classic",
    glowColor: "#f59e0b",
    glowRgb: "245,158,11",
    stats: ["3×3 Grid", "5 Paylines", "100× Max Win"],
    features: ["Wild", "Scatter", "Free Spins"],
    icon: Star,
    rtp: "96.5%",
    thumbnail: "/images/Cherry.png",
    badge: { label: "🔥 HOT", color: "bg-orange-500/30 text-orange-300 border-orange-400/40" },
    description: "Timeless fruit slots with classic 3-reel action",
  },
  {
    id: "fiveReel",
    glowColor: "#8b5cf6",
    glowRgb: "139,92,246",
    stats: ["5×3 Grid", "20 Paylines", "200× Max Win"],
    features: ["Wild", "Expanding Wild", "Free Spins"],
    icon: Zap,
    rtp: "97.1%",
    thumbnail: "/images/five-reel-deluxe.png",
    description: "Premium 5-reel action with expanding wilds & multipliers",
  },
  {
    id: "cascade",
    glowColor: "#10b981",
    glowRgb: "16,185,129",
    stats: ["5×5 Grid", "Chain Wins", "10× Multiplier"],
    features: ["Cascade", "Wild", "Multiplier"],
    icon: Layers,
    rtp: "97.3%",
    thumbnail: "/images/cascading-reels.png",
    badge: { label: "✨ NEW", color: "bg-emerald-500/30 text-emerald-300 border-emerald-400/40" },
    description: "Symbols explode & cascade — chain wins multiply your payout",
  },
  {
    id: "megaways",
    glowColor: "#ec4899",
    glowRgb: "236,72,153",
    stats: ["6 Reels", "117,649 Ways", "500× Max Win"],
    features: ["Megaways", "Free Spins", "Expanding Reels"],
    icon: Shuffle,
    rtp: "96.8%",
    thumbnail: "/images/megaways.jpg",
    description: "Max volatility — up to 117,649 ways to win on every spin",
  },
];

export function GameShowcaseSection() {
  const t = useTranslations("landing.games");
  const { track } = useConversionTracker();

  return (
    <section id="games" className="relative py-24 md:py-32 overflow-x-hidden">
      {/* Edge floating symbols */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {LEFT_SYMBOLS.map((s, i) => (
          <motion.img
            key={`l-${i}`}
            src={s.src}
            alt=""
            className="absolute select-none object-contain"
            style={{
              top: s.top,
              left: 0,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              transform: `rotate(${s.rotate}deg) translateX(-18%)`,
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
            }}
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
        {RIGHT_SYMBOLS.map((s, i) => (
          <motion.img
            key={`r-${i}`}
            src={s.src}
            alt=""
            className="absolute select-none object-contain"
            style={{
              top: s.top,
              right: 0,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              transform: `rotate(${s.rotate}deg) translateX(18%)`,
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
            }}
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 4.5 + i * 0.4, repeat: Infinity, delay: s.delay + 0.2, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <ScrollReveal>
          <SectionHeadline sub={t("subheadline")}>{t("headline")}</SectionHeadline>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {GAMES.map((game, i) => (
            <ScrollReveal key={game.id} delay={i * 0.08}>
              <GameCard game={game} onPlay={() => track("cta_click", { section: "games", game: game.id })} t={t} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function GameCard({
  game,
  onPlay,
  t,
}: {
  game: (typeof GAMES)[number];
  onPlay: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <motion.div
      className="group relative h-full min-h-[400px] cursor-pointer overflow-hidden rounded-2xl"
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        boxShadow: `0 0 0 1px rgba(${game.glowRgb},0.25)`,
      }}
    >
      {/* Animated glow border on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: `0 0 32px 2px rgba(${game.glowRgb},0.35), inset 0 0 32px 2px rgba(${game.glowRgb},0.08)`,
        }}
      />

      {/* Thumbnail background — fills full card */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={game.thumbnail}
          alt={game.id}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          style={{ filter: "brightness(0.55) saturate(1.3)" }}
        />
        {/* Gradient overlay — top to bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              rgba(0,0,0,0.0) 0%,
              rgba(0,0,0,0.3) 30%,
              rgba(0,0,0,0.82) 70%,
              rgba(0,0,0,0.96) 100%)`,
          }}
        />
        {/* Color tint from game's glow color */}
        <div
          className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
          style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${game.glowRgb},0.6) 0%, transparent 70%)` }}
        />
      </div>

      {/* Badge */}
      {game.badge && (
        <div className="absolute right-3 top-3 z-10">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm ${game.badge.color}`}>
            {game.badge.label}
          </span>
        </div>
      )}

      {/* RTP pill — top left */}
      <div className="absolute left-3 top-3 z-10">
        <span className="rounded-full border border-white/15 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-sm">
          {game.rtp} RTP
        </span>
      </div>

      {/* Content — pinned to bottom */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-5">
        {/* Game name + icon */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-black text-white leading-tight">
            {t(`${game.id}.name`)}
          </h3>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `rgba(${game.glowRgb},0.3)`, border: `1px solid rgba(${game.glowRgb},0.5)` }}
          >
            <game.icon className="h-4.5 w-4.5 text-white" style={{ color: game.glowColor }} />
          </div>
        </div>

        {/* Description */}
        <p className="mt-1.5 text-xs text-white/60 leading-snug line-clamp-2">
          {game.description}
        </p>

        {/* Stat pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {game.stats.map((stat) => (
            <span
              key={stat}
              className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm"
            >
              {stat}
            </span>
          ))}
        </div>

        {/* Feature tags */}
        <div className="mt-2 flex flex-wrap gap-1">
          {game.features.map((feat) => (
            <span
              key={feat}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `rgba(${game.glowRgb},0.2)`,
                color: game.glowColor,
                border: `1px solid rgba(${game.glowRgb},0.3)`,
              }}
            >
              {feat}
            </span>
          ))}
        </div>

        {/* Play button — slides up on hover */}
        <Link
          href="/game"
          onClick={onPlay}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-300 group-hover:opacity-100 opacity-80"
          style={{
            background: `linear-gradient(135deg, rgba(${game.glowRgb},0.8), rgba(${game.glowRgb},0.5))`,
            border: `1px solid rgba(${game.glowRgb},0.5)`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          {t("playNow")}
        </Link>
      </div>
    </motion.div>
  );
}
