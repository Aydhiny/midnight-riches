"use client";

import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Animated rolling number for win display */
function RollingNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const duration = Math.min(1200, Math.abs(to - from) * 8);
    startRef.current = null;

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{display.toFixed(2)}
    </span>
  );
}

/** Animated LED dot strip */
function LedStrip({ count = 24, className = "" }: { count?: number; className?: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % count), 80);
    return () => clearInterval(id);
  }, [count]);

  const colors = ["#fbbf24", "#f59e0b", "#ec4899", "#a855f7", "#7c3aed", "#10b981"];

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {Array.from({ length: count }, (_, i) => {
        const colorIdx = i % colors.length;
        const isActive = i === phase || i === (phase + Math.floor(count / 2)) % count;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: 6,
              height: 6,
              background: colors[colorIdx],
              opacity: isActive ? 1 : 0.25,
              boxShadow: isActive ? `0 0 8px ${colors[colorIdx]}, 0 0 16px ${colors[colorIdx]}80` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

const PAYTABLE = [
  { symbol: "7️⃣",  label: "SEVEN",  mult: "×100", color: "#ef4444" },
  { symbol: "💎",  label: "WILD",   mult: "×50",  color: "#a78bfa" },
  { symbol: "🍒",  label: "CHERRY", mult: "×20",  color: "#f43f5e" },
  { symbol: "🍉",  label: "MELON",  mult: "×10",  color: "#10b981" },
  { symbol: "⭐",  label: "STAR",   mult: "×5",   color: "#fbbf24" },
];

interface CabinetFrameProps {
  children: React.ReactNode;
}

export function CabinetFrame({ children }: CabinetFrameProps) {
  const { lastResult, bonus, spinState } = useGameStore();
  const { balance } = useWalletStore();

  const win = lastResult?.totalWin ?? 0;
  const isWin = win > 0 && spinState !== "animating";
  const isBigWin = win > 50;

  return (
    <div className="relative w-full select-none" style={{ perspective: "1400px" }}>
      {/* ── Outer ambient glow beneath cabinet ──────────────────────────── */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-3xl opacity-60"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, rgba(236,72,153,0.1) 50%, transparent 75%)",
          filter: "blur(20px)",
        }}
      />

      {/* ── Cabinet shell ────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1e0d38 0%, #0d0620 35%, #180830 70%, #0d0420 100%)",
          boxShadow: [
            "0 0 0 1px rgba(139,92,246,0.35)",
            "0 0 0 3px rgba(0,0,0,0.8)",
            "0 0 0 4px rgba(124,58,237,0.2)",
            "0 0 60px rgba(124,58,237,0.2)",
            "0 0 100px rgba(236,72,153,0.08)",
            "0 32px 80px rgba(0,0,0,0.8)",
            "inset 0 1px 0 rgba(255,255,255,0.1)",
            "inset 0 -1px 0 rgba(0,0,0,0.5)",
          ].join(", "),
        }}
      >
        {/* ── Neon top edge ─────────────────────────────────────────────── */}
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 via-50% to-amber-400" />

        {/* ── LED marquee strip ──────────────────────────────────────────── */}
        <div
          className="py-1.5 px-4 border-b border-white/[0.06]"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <LedStrip count={32} />
        </div>

        {/* ── Machine title banner ───────────────────────────────────────── */}
        <div
          className="flex items-center justify-center py-1.5 border-b border-white/[0.06] gap-3"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(124,58,237,0.12) 50%, rgba(0,0,0,0) 100%)" }}
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/40" />
          <span
            className="text-[11px] font-black tracking-[0.3em] uppercase"
            style={{
              background: "linear-gradient(90deg, #c4b5fd, #fbbf24, #f472b6, #c4b5fd)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Midnight Riches
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/40" />
        </div>

        {/* ── Paytable strip ────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center border-b border-white/[0.06]"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          {PAYTABLE.map((row, i) => (
            <div
              key={i}
              className="flex flex-1 items-center justify-between gap-1 border-r border-white/[0.05] last:border-r-0 px-2 py-1.5"
            >
              <span className="text-[14px] leading-none">{row.symbol}</span>
              <div className="text-right">
                <div className="text-[7px] font-bold uppercase tracking-widest text-white/25">{row.label}</div>
                <div
                  className="text-[11px] font-black"
                  style={{ color: row.color }}
                >
                  {row.mult}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Side neon bars + reel area ────────────────────────────────── */}
        <div className="relative flex">
          {/* Left neon bar */}
          <div className="w-4 shrink-0 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(124,58,237,0.9), rgba(236,72,153,0.7), rgba(245,158,11,0.5), rgba(16,185,129,0.4))",
                boxShadow: "3px 0 20px rgba(124,58,237,0.7)",
              }}
            />
            {/* Vertical tick marks on bar */}
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-white/20"
                style={{ top: `${(i + 1) * 11.11}%` }}
              />
            ))}
          </div>

          {/* Main reel area */}
          <div className="flex-1 relative px-1 py-2">
            {/* Reel screen bezel */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                boxShadow: [
                  "inset 0 0 40px rgba(0,0,0,0.9)",
                  "inset 0 0 80px rgba(0,20,60,0.6)",
                  "inset 0 2px 8px rgba(0,0,0,0.8)",
                  "inset 0 -2px 8px rgba(0,0,0,0.8)",
                ].join(", "),
              }}
            >
              {/* CRT scanline overlay */}
              <div
                className="pointer-events-none absolute inset-0 z-10 rounded-lg"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 6px)",
                  mixBlendMode: "overlay",
                }}
              />

              {/* Win flash overlay */}
              <AnimatePresence>
                {isWin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.2, 0, 0.15, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, times: [0, 0.2, 0.4, 0.6, 1] }}
                    className="pointer-events-none absolute inset-0 z-20 rounded-lg"
                    style={{ background: isBigWin ? "rgba(251,191,36,0.7)" : "rgba(52,211,153,0.5)" }}
                  />
                )}
              </AnimatePresence>

              {/* Big win text overlay */}
              <AnimatePresence>
                {isBigWin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-lg"
                  >
                    <div
                      className="text-4xl font-black tracking-tight px-6 py-3 rounded-2xl"
                      style={{
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 20px rgba(251,191,36,0.8))",
                      }}
                    >
                      BIG WIN!
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {children}
            </div>
          </div>

          {/* Right neon bar */}
          <div className="w-4 shrink-0 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(16,185,129,0.4), rgba(245,158,11,0.5), rgba(236,72,153,0.7), rgba(124,58,237,0.9))",
                boxShadow: "-3px 0 20px rgba(236,72,153,0.6)",
              }}
            />
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 h-px bg-white/20"
                style={{ top: `${(i + 1) * 11.11}%` }}
              />
            ))}
          </div>
        </div>

        {/* ── Stats display ─────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-3 divide-x divide-white/[0.06] border-t border-white/[0.06]"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(10,3,25,0.8) 100%)" }}
        >
          {[
            { label: "BALANCE", value: balance, color: "#fbbf24", glow: "rgba(251,191,36,0.4)", bold: true },
            {
              label: bonus.isActive ? "FREE SPINS" : "WIN",
              value: bonus.isActive ? bonus.spinsRemaining : win,
              raw: bonus.isActive,
              color: bonus.isActive ? "#f472b6" : win > 0 ? "#34d399" : "#34d39966",
              glow: bonus.isActive ? "rgba(244,114,182,0.4)" : "rgba(52,211,153,0.3)",
            },
            {
              label: bonus.isActive ? "BONUS WIN" : "TOTAL BET",
              value: bonus.isActive ? bonus.totalBonusWin : 0,
              color: "#a78bfa",
              glow: "rgba(167,139,250,0.3)",
            },
          ].map(({ label, value, color, glow, raw }, i) => (
            <div key={i} className="flex flex-col items-center py-2.5 px-3">
              <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/20">{label}</div>
              <div
                className="text-[15px] font-black leading-tight mt-0.5 tabular-nums"
                style={{
                  color,
                  textShadow: `0 0 12px ${glow}`,
                  fontFamily: "monospace",
                  letterSpacing: "0.02em",
                }}
              >
                {raw ? (
                  <span>{value as number}</span>
                ) : (
                  <RollingNumber value={value as number} prefix="$" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom LED strip ───────────────────────────────────────────── */}
        <div
          className="py-1.5 px-4 border-t border-white/[0.06]"
          style={{ background: "rgba(0,0,0,0.6)" }}
        >
          <LedStrip count={32} />
        </div>

        {/* ── Neon bottom edge ──────────────────────────────────────────── */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-500" />

        {/* ── Corner accent lights ─────────────────────────────────────── */}
        {[
          { cls: "top-0 left-0", color: "rgba(124,58,237,0.9)" },
          { cls: "top-0 right-0", color: "rgba(236,72,153,0.9)" },
          { cls: "bottom-0 left-0", color: "rgba(245,158,11,0.9)" },
          { cls: "bottom-0 right-0", color: "rgba(124,58,237,0.9)" },
        ].map(({ cls, color }, i) => (
          <div
            key={i}
            className={`absolute h-4 w-4 rounded-full opacity-80 ${cls}`}
            style={{ background: color, filter: "blur(8px)" }}
          />
        ))}
      </div>

      {/* ── Floor reflection glow ─────────────────────────────────────────── */}
      <div
        className="absolute left-6 right-6 -bottom-4 h-10 rounded-full opacity-30 blur-2xl"
        style={{ background: "linear-gradient(to right, #7c3aed, #ec4899, #f59e0b)" }}
      />
      <div
        className="absolute left-16 right-16 -bottom-6 h-6 rounded-full opacity-15 blur-3xl"
        style={{ background: "linear-gradient(to right, #ec4899, #7c3aed)" }}
      />
    </div>
  );
}
