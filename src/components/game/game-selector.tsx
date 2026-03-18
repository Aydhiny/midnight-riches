"use client";

import { useCallback } from "react";
import { useGameStore } from "@/store/game-store";
import type { GameType } from "@/types";
import { getEngine } from "@/lib/game/engines";

const GAME_VARIANTS: { id: GameType; label: string; description: string; icon: string }[] = [
  { id: "classic", label: "Classic Fruits", description: "3×3 • 5 Lines", icon: "🍒" },
  { id: "five-reel", label: "Five Reel Deluxe", description: "5×3 • 20 Lines • Wilds", icon: "⭐" },
  { id: "cascade", label: "Cascade Crush", description: "5×5 • Cascading Wins", icon: "💎" },
  { id: "megaways", label: "Mega Ways", description: "6 Reels • Up to 117,649 Ways", icon: "🔥" },
];

export function GameSelector() {
  const { gameType, spinState, setGameType } = useGameStore();

  const handleSelect = useCallback((type: GameType) => {
    if (spinState !== "idle") return;
    setGameType(type);
  }, [spinState, setGameType]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {GAME_VARIANTS.map((variant) => {
        const isActive = gameType === variant.id;
        const engine = getEngine(variant.id);

        return (
          <button
            key={variant.id}
            onClick={() => handleSelect(variant.id)}
            disabled={spinState !== "idle"}
            className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all ${
              isActive
                ? "border-yellow-500 bg-purple-900/60 shadow-lg shadow-yellow-500/20"
                : "border-purple-800 bg-purple-950/40 hover:border-purple-600"
            } ${spinState !== "idle" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            {isActive && (
              <div className="absolute inset-0 rounded-xl border-2 border-yellow-400 opacity-60" />
            )}
            <div className="text-2xl">{variant.icon}</div>
            <div className="mt-1 text-sm font-bold text-white">{variant.label}</div>
            <div className="text-xs text-purple-400">{variant.description}</div>
            <div className="mt-1 text-xs text-purple-500">
              RTP: {(engine.config.rtp * 100).toFixed(1)}%
            </div>
          </button>
        );
      })}
    </div>
  );
}
