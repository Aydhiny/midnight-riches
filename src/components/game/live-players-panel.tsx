"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface LivePlayer {
  id: number;
  initials: string;
  username: string;
  activity: string;
  timeAgo: string;
  badge: "WIN" | "BONUS" | null;
  avatarFrom: string;
  avatarTo: string;
}

const INITIAL_PLAYERS: LivePlayer[] = [
  {
    id: 1,
    initials: "AJ",
    username: "Lucky_AJ",
    activity: "$12.50 on Classic",
    timeAgo: "just now",
    badge: "WIN",
    avatarFrom: "#7c3aed",
    avatarTo: "#a855f7",
  },
  {
    id: 2,
    initials: "MK",
    username: "MegaSpin_K",
    activity: "💎 BIG WIN $250!",
    timeAgo: "just now",
    badge: "WIN",
    avatarFrom: "#b45309",
    avatarTo: "#f59e0b",
  },
  {
    id: 3,
    initials: "TS",
    username: "StarPlayer7",
    activity: "🎰 Jackpot $1,200!",
    timeAgo: "2m ago",
    badge: "WIN",
    avatarFrom: "#065f46",
    avatarTo: "#10b981",
  },
  {
    id: 4,
    initials: "RB",
    username: "RocketBet_R",
    activity: "Bonus round x5!",
    timeAgo: "2m ago",
    badge: "BONUS",
    avatarFrom: "#1d4ed8",
    avatarTo: "#3b82f6",
  },
  {
    id: 5,
    initials: "ZN",
    username: "NightOwl_Z",
    activity: "$8.00 on Five-Reel",
    timeAgo: "3m ago",
    badge: "WIN",
    avatarFrom: "#9d174d",
    avatarTo: "#ec4899",
  },
  {
    id: 6,
    initials: "DX",
    username: "DiamondX99",
    activity: "Free spins x12!",
    timeAgo: "4m ago",
    badge: "BONUS",
    avatarFrom: "#0e7490",
    avatarTo: "#06b6d4",
  },
  {
    id: 7,
    initials: "VL",
    username: "VegasLion",
    activity: "$35.00 on Cascade",
    timeAgo: "5m ago",
    badge: "WIN",
    avatarFrom: "#7c2d12",
    avatarTo: "#f97316",
  },
  {
    id: 8,
    initials: "QP",
    username: "QuickPlay_Q",
    activity: "💎 BIG WIN $180!",
    timeAgo: "5m ago",
    badge: "WIN",
    avatarFrom: "#4c1d95",
    avatarTo: "#8b5cf6",
  },
  {
    id: 9,
    initials: "SW",
    username: "SpinWizard",
    activity: "Megaways bonus!",
    timeAgo: "6m ago",
    badge: "BONUS",
    avatarFrom: "#14532d",
    avatarTo: "#22c55e",
  },
  {
    id: 10,
    initials: "CP",
    username: "CoinPusher_C",
    activity: "$5.25 on Classic",
    timeAgo: "8m ago",
    badge: null,
    avatarFrom: "#374151",
    avatarTo: "#6b7280",
  },
];

const NEW_WIN_EVENTS: LivePlayer[] = [
  {
    id: 11,
    initials: "FK",
    username: "FlashKing_F",
    activity: "🎰 Jackpot $2,500!",
    timeAgo: "just now",
    badge: "WIN",
    avatarFrom: "#92400e",
    avatarTo: "#fbbf24",
  },
  {
    id: 12,
    initials: "NR",
    username: "NeonRider_N",
    activity: "💎 BIG WIN $340!",
    timeAgo: "just now",
    badge: "WIN",
    avatarFrom: "#5b21b6",
    avatarTo: "#c084fc",
  },
  {
    id: 13,
    initials: "GS",
    username: "GoldSeeker",
    activity: "Free spins x20!",
    timeAgo: "just now",
    badge: "BONUS",
    avatarFrom: "#064e3b",
    avatarTo: "#34d399",
  },
];

export function LivePlayersPanel() {
  const [players, setPlayers] = useState<LivePlayer[]>(INITIAL_PLAYERS);
  const [eventIndex, setEventIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPlayer = NEW_WIN_EVENTS[eventIndex % NEW_WIN_EVENTS.length];
      setPlayers((prev) => {
        const updated = [{ ...newPlayer, id: Date.now() }, ...prev.slice(0, 9)];
        return updated;
      });
      setEventIndex((i) => i + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [eventIndex]);

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-white/[0.06] bg-black/30 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-3">
        <span className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          LIVE
        </span>
        <span className="text-xs font-semibold text-white/70">Active Players</span>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence initial={false}>
          {players.map((player) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.35 }}
              className="flex items-start gap-2.5 border-b border-white/[0.04] px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
            >
              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${player.avatarFrom}, ${player.avatarTo})`,
                }}
              >
                {player.initials}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-semibold text-white/90">
                    {player.username}
                  </span>
                  {player.badge === "WIN" && (
                    <span className="shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-400">
                      WIN
                    </span>
                  )}
                  {player.badge === "BONUS" && (
                    <span className="shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide bg-purple-500/20 text-purple-400">
                      BONUS
                    </span>
                  )}
                </div>
                <div className="truncate text-[10px] text-white/50">{player.activity}</div>
              </div>

              {/* Time */}
              <span className="shrink-0 text-[9px] text-white/30 mt-0.5">{player.timeAgo}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
