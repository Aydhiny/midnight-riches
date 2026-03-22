"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Maximize2, Minimize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export type GameSize = "compact" | "normal" | "large" | "expanded";

export const SIZE_CLASS: Record<GameSize, string> = {
  compact:  "max-w-lg",
  normal:   "max-w-2xl",
  large:    "max-w-4xl",
  expanded: "max-w-6xl",
};

const SIZE_KEY = "mr_game_size";

export function loadGameSize(): GameSize {
  try {
    const v = localStorage.getItem(SIZE_KEY);
    if (v === "compact" || v === "normal" || v === "large" || v === "expanded") return v;
    // Default to compact on narrow mobile screens (< 480px), large otherwise
    if (typeof window !== "undefined" && window.innerWidth < 480) return "compact";
  } catch { /* SSR */ }
  return "large";
}

const SIZES: { id: GameSize; icon: React.ReactNode; px: string }[] = [
  { id: "compact",  icon: <Minimize2 className="h-3.5 w-3.5" />, px: "320px" },
  { id: "normal",   icon: <span className="text-[11px] font-black">M</span>, px: "512px" },
  { id: "large",    icon: <span className="text-[11px] font-black">L</span>, px: "768px" },
  { id: "expanded", icon: <Maximize2 className="h-3.5 w-3.5" />, px: "1024px" },
];

interface GameOptionsPanelProps {
  size: GameSize;
  onSizeChange: (size: GameSize) => void;
}

export function GameOptionsPanel({ size, onSizeChange }: GameOptionsPanelProps) {
  const t = useTranslations("game");
  const [open, setOpen] = useState(false);

  function handleSize(s: GameSize) {
    onSizeChange(s);
    try { localStorage.setItem(SIZE_KEY, s); } catch { /* SSR */ }
  }

  return (
    <div className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md overflow-hidden transition-all">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06]"
        aria-expanded={open}
      >
        <span className="text-sm" aria-hidden>⚙️</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {open ? t("gameOptions.collapse") : t("gameOptions.expand")}
        </span>
        {open
          ? <ChevronUp  className="ml-auto h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
          : <ChevronDown className="ml-auto h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
        }
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 border-t border-[var(--glass-border)] space-y-5">

          {/* ── Game size selector ─────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2.5 font-semibold">
              {t("gameOptions.gameSize")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((s) => {
                const active = size === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSize(s.id)}
                    title={t(`gameOptions.${s.id}`)}
                    className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all active:scale-95 ${
                      active
                        ? "border-violet-500 bg-violet-500/20 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                        : "border-[var(--glass-border)] bg-white/[0.03] text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {s.icon}
                    <span className="leading-none truncate max-w-full">
                      {t(`gameOptions.${s.id}`)}
                    </span>
                    {active && (
                      <span className="h-1 w-1 rounded-full bg-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)] text-center">
              {t("gameOptions.currentSize")}: <span className="text-violet-400 font-semibold">{t(`gameOptions.${size}`)}</span>
            </p>
          </div>

          {/* ── Themes & visuals ───────────────────────────────── */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-2.5 font-semibold">
              {t("gameOptions.themes")}
            </p>
            <Link
              href="/shop"
              className="flex items-center gap-2.5 rounded-lg border border-[var(--glass-border)] bg-white/[0.03] px-3 py-2 text-xs text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)] transition-all group"
            >
              <span className="text-base shrink-0" aria-hidden>🛍️</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{t("gameOptions.browseShop")}</span>
                <span className="block text-[10px] text-[var(--text-muted)] truncate">{t("gameOptions.browseShopDesc")}</span>
              </span>
              <span className="text-[var(--text-muted)] group-hover:text-violet-400 transition-colors shrink-0">→</span>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
