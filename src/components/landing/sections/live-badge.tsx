"use client";

import { useState, useEffect, useMemo } from "react";

export function LiveBadge() {
  const initialCount = useMemo(() => 2400 + Math.floor(Math.random() * 800), []);
  const [playerCount, setPlayerCount] = useState(initialCount);

  useEffect(() => {
    const update = () => {
      setPlayerCount(
        2400 + Math.floor(Math.random() * 800)
      );
    };
    // Update every 45s ± random jitter
    const scheduleNext = () => {
      const delay = 40000 + Math.random() * 10000;
      return setTimeout(() => {
        update();
        const next = scheduleNext();
        return next;
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.12] backdrop-blur-md shadow-[0_0_20px_rgba(0,255,100,0.08)] overflow-hidden">
      {/* Triple-ring pulse */}
      <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
        <span className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-50 animate-ping [animation-delay:0.3s]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
      </div>

      <span className="text-xs font-semibold tracking-widest uppercase text-green-300/90">
        Live
      </span>

      <span className="w-px h-3 bg-white/20 shrink-0" />

      <span className="text-xs font-medium text-white/70 whitespace-nowrap">
        <span className="text-white font-bold tabular-nums">{playerCount.toLocaleString()}</span>{" "}
        players online
      </span>

      {/* Shimmer sweep */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
          style={{ animation: "ticker-shimmer 3s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
