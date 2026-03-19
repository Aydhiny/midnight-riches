"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export function LiveBadge() {
  const t = useTranslations("landing.hero");
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    setPlayerCount(2400 + Math.floor(Math.random() * 800));
  }, []);

  useEffect(() => {
    const scheduleNext = (): ReturnType<typeof setTimeout> => {
      const delay = 40000 + Math.random() * 10000;
      return setTimeout(() => {
        setPlayerCount(2400 + Math.floor(Math.random() * 800));
        scheduleNext();
      }, delay);
    };
    const t = scheduleNext();
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] backdrop-blur-md overflow-hidden" style={{ boxShadow: "0 0 20px rgba(0,255,100,0.06)" }}>
      <div className="relative flex items-center justify-center w-3 h-3 shrink-0">
        <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-30 animate-ping" />
        <span className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-50 animate-ping [animation-delay:0.3s]" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
      </div>

      <span className="text-xs font-semibold tracking-widest uppercase text-green-500">
        Live
      </span>

      <span className="w-px h-3 bg-[var(--glass-border)] shrink-0" />

      <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
        <span className="text-[var(--text-primary)] font-bold tabular-nums" suppressHydrationWarning>
          {playerCount > 0 ? playerCount.toLocaleString() : "—"}
        </span>{" "}
        {t("playersOnline")}
      </span>

      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent"
          style={{ animation: "ticker-shimmer 3s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}
