"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { DailyChallengesWidget } from "@/components/game/daily-challenges-widget";
import { LiveFeed } from "@/components/game/live-feed";
import { seedCommunityWinsAction } from "@/server/actions/seed-notifications";

const SlotMachine = dynamic(
  () => import("@/components/game/slot-machine").then((mod) => mod.SlotMachine),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
      </div>
    ),
  }
);

export default function GamePage() {
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    seedCommunityWinsAction();
  }, []);

  return (
    <div className="-mx-4 -my-8 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left Panel — Live Feed */}
      <aside className="hidden w-60 shrink-0 border-r border-[var(--glass-border)] p-2 lg:flex lg:flex-col">
        <LiveFeed />
      </aside>

      {/* Center Panel — Game */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-4">
        <div className="flex w-full max-w-3xl flex-col items-center gap-4">
          <SlotMachine />
        </div>
      </div>

      {/* Right Panel — Sidebar */}
      <aside className="hidden w-70 shrink-0 flex-col gap-3 overflow-y-auto border-l border-[var(--glass-border)] p-3 lg:flex">
        {/* Daily Challenges */}
        <DailyChallengesWidget />

        {/* How to Play */}
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left backdrop-blur-md transition-colors hover:bg-white/[0.06]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-base">
            ?
          </span>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">How to Play</div>
            <div className="text-[10px] text-[var(--text-muted)]">Learn the rules & features</div>
          </div>
        </button>

        {/* Leaderboard */}
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left backdrop-blur-md transition-colors hover:bg-white/[0.06]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-base">
            &#9734;
          </span>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">Leaderboard</div>
            <div className="text-[10px] text-[var(--text-muted)]">Top players this week</div>
          </div>
        </button>

        {/* Provably Fair */}
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left backdrop-blur-md transition-colors hover:bg-white/[0.06]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-base">
            &#10003;
          </span>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">Provably Fair</div>
            <div className="text-[10px] text-[var(--text-muted)]">Verify game fairness</div>
          </div>
        </button>

        {/* Quick Stats */}
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 backdrop-blur-md">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Quick Stats
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Total Bets Today</span>
              <span className="text-[11px] font-bold text-[var(--text-primary)]">
                {Math.floor(Math.random() * 200 + 50).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Biggest Win</span>
              <span className="text-[11px] font-bold text-amber-400">
                {Math.floor(Math.random() * 5000 + 500).toLocaleString()} cr
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-secondary)]">Players Online</span>
              <span className="text-[11px] font-bold text-emerald-400">
                {Math.floor(Math.random() * 80 + 40)}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
