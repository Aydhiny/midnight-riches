"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface FeedEntry {
  id: string;
  name: string;
  initials: string;
  color: string;
  game: string;
  amount: number;
  timeAgo: string;
}

const NAMES = [
  "Alex K.", "Jordan M.", "Sam L.", "Riley P.", "Morgan T.",
  "Casey D.", "Avery B.", "Quinn R.", "Blake S.", "Taylor W.",
  "Drew H.", "Jamie F.", "Dakota N.", "Skyler C.", "Reese V.",
  "Hayden G.", "Parker J.", "Emery A.", "Rowan Z.", "Phoenix E.",
];

const AVATAR_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
  "bg-indigo-500", "bg-teal-500",
];

const GAMES = ["Classic Fruits", "Five Reel Deluxe", "Cascade Crush", "Mega Ways"];

function randomEntry(): FeedEntry {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const initials = name.split(" ").map(w => w[0]).join("");
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  const game = GAMES[Math.floor(Math.random() * GAMES.length)];

  // Bias toward smaller wins, occasional large ones
  const roll = Math.random();
  let amount: number;
  if (roll < 0.5) {
    amount = Math.floor(Math.random() * 50 + 5);
  } else if (roll < 0.85) {
    amount = Math.floor(Math.random() * 200 + 50);
  } else if (roll < 0.97) {
    amount = Math.floor(Math.random() * 1000 + 200);
  } else {
    amount = Math.floor(Math.random() * 5000 + 1000);
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    initials,
    color,
    game,
    amount,
    timeAgo: "just now",
  };
}

function generateInitialFeed(): FeedEntry[] {
  const times = ["just now", "1m ago", "2m ago", "3m ago", "5m ago", "7m ago", "10m ago", "12m ago"];
  return times.map((time) => ({ ...randomEntry(), timeAgo: time }));
}

export function LiveFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>(() => generateInitialFeed());
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addEntry = useCallback(() => {
    setEntries((prev) => {
      const newEntry = randomEntry();
      // Update existing entries' time labels
      const updated = prev.map((e, i) => {
        if (i === 0) return { ...e, timeAgo: "1m ago" };
        if (i < 3) return { ...e, timeAgo: `${i + 1}m ago` };
        return e;
      });
      return [newEntry, ...updated].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    // Add a new entry every 3-6 seconds
    const schedule = () => {
      const delay = 3000 + Math.random() * 3000;
      intervalRef.current = setTimeout(() => {
        addEntry();
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [addEntry]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2.5">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          Live Wins
        </span>
      </div>

      {/* Scrolling feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1.5 space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
          >
            {/* Avatar */}
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${entry.color}`}>
              {entry.initials}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-[11px] font-semibold text-[var(--text-primary)]">
                  {entry.name}
                </span>
                <span className={`shrink-0 text-[11px] font-bold ${
                  entry.amount >= 1000
                    ? "text-amber-400"
                    : entry.amount >= 200
                    ? "text-emerald-400"
                    : "text-[var(--text-secondary)]"
                }`}>
                  +{entry.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="truncate text-[9px] text-[var(--text-muted)]">{entry.game}</span>
                <span className="shrink-0 text-[9px] text-[var(--text-muted)]">{entry.timeAgo}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
