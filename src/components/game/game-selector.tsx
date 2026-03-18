"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/game-store";
import type { GameType } from "@/types";
import { getEngine } from "@/lib/game/engines";


const GAME_VARIANTS: {
  id: GameType;
  label: string;
  description: string;
  subDesc: string;
  accent: string;
  bgGradient: string;
  thumbnail: string;
  badge?: string;
}[] = [
  {
    id: "classic",
    label: "Classic Fruits",
    description: "3×3 • 5 Lines",
    subDesc: "Timeless fruit slots",
    accent: "border-amber-500/60 shadow-amber-500/20",
    bgGradient: "from-amber-950/80 to-yellow-900/50",
    thumbnail: "/images/Cherry.png",   // uses cherry as hero symbol
    badge: "🔥 HOT",
  },
  {
    id: "five-reel",
    label: "Five Reel Deluxe",
    description: "5×3 • 20 Lines",
    subDesc: "Wilds & multipliers",
    accent: "border-violet-500/60 shadow-violet-500/20",
    bgGradient: "from-violet-950/80 to-purple-900/50",
    thumbnail: "/images/five-reel-deluxe.png",
  },
  {
    id: "cascade",
    label: "Cascade Crush",
    description: "5×5 • Chain Wins",
    subDesc: "Cascading multipliers",
    accent: "border-emerald-500/60 shadow-emerald-500/20",
    bgGradient: "from-emerald-950/80 to-teal-900/50",
    thumbnail: "/images/cascading-reels.png",
    badge: "✨ NEW",
  },
  {
    id: "megaways",
    label: "Mega Ways",
    description: "6 Reels • 117,649 Ways",
    subDesc: "Max volatility",
    accent: "border-pink-500/60 shadow-pink-500/20",
    bgGradient: "from-pink-950/80 to-rose-900/50",
    thumbnail: "/images/megaways.jpg",
  },
];

export function GameSelector() {
  const { gameType, spinState, setGameType } = useGameStore();
  const [switching, setSwitching] = useState<GameType | null>(null);

  const handleSelect = useCallback((type: GameType) => {
    if (spinState !== "idle" || type === gameType) return;
    setSwitching(type);
    // Defer the heavy Zustand update so the overlay renders first
    requestAnimationFrame(() => {
      setTimeout(() => {
        setGameType(type);
        setSwitching(null);
      }, 16); // One more frame for overlay to paint
    });
  }, [spinState, gameType, setGameType]);

  const isDisabled = spinState !== "idle";

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Select Game
        </h3>
        {switching && (
          <span className="text-xs text-[var(--text-muted)] animate-pulse">Loading…</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {GAME_VARIANTS.map((variant) => {
          const isActive = gameType === variant.id;
          const isSwitching = switching === variant.id;
          const engine = getEngine(variant.id);

          return (
            <motion.button
              key={variant.id}
              onClick={() => handleSelect(variant.id)}
              disabled={isDisabled}
              whileHover={!isDisabled ? { scale: 1.02, y: -2 } : undefined}
              whileTap={!isDisabled ? { scale: 0.98 } : undefined}
              className={[
                "relative overflow-hidden rounded-xl border text-left transition-all duration-200",
                "bg-gradient-to-b",
                variant.bgGradient,
                isActive
                  ? `${variant.accent} shadow-lg`
                  : "border-[var(--glass-border)] hover:border-white/20",
                isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              ].join(" ")}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="game-active"
                  className="absolute inset-0 rounded-xl border-2 border-white/20 pointer-events-none"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}

              {/* Badge */}
              {variant.badge && (
                <div className="absolute right-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm">
                  {variant.badge}
                </div>
              )}

              {/* Loading overlay when switching */}
              <AnimatePresence>
                {isSwitching && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/50 backdrop-blur-sm"
                  >
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game thumbnail image */}
              <div className="pointer-events-none relative h-20 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={variant.thumbnail}
                  alt={variant.label}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  style={{ filter: "brightness(0.85) saturate(1.2)" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="px-2.5 pb-2.5">
                <div className="text-xs font-bold text-white leading-tight">{variant.label}</div>
                <div className="mt-0.5 text-[10px] text-white/50">{variant.description}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] text-white/40">{variant.subDesc}</span>
                  <span className="text-[9px] font-semibold text-emerald-400">
                    {(engine.config.rtp * 100).toFixed(1)}% RTP
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
