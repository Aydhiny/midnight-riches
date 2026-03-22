"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Animated rolling number for win display */
function RollingNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const fromRef  = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to   = value;
    if (from === to) return;
    const duration = Math.min(1200, Math.abs(to - from) * 8);
    startRef.current = null;

    function step(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
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
      {display.toFixed(2)}{suffix}
    </span>
  );
}

/** Animated LED dot strip */
function LedStrip({ count = 28, size = 7 }: { count?: number; size?: number }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % count), 75);
    return () => clearInterval(id);
  }, [count]);

  const colors = ["#fbbf24", "#f59e0b", "#ec4899", "#a855f7", "#7c3aed", "#10b981", "#3b82f6"];

  return (
    <div className="flex items-center justify-center gap-[5px]">
      {Array.from({ length: count }, (_, i) => {
        const colorIdx = i % colors.length;
        const isActive = i === phase || i === (phase + Math.floor(count / 2)) % count;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-[60ms]"
            style={{
              width:      size,
              height:     size,
              background: colors[colorIdx],
              opacity:    isActive ? 1 : 0.22,
              boxShadow:  isActive
                ? `0 0 ${size + 2}px ${colors[colorIdx]}, 0 0 ${size * 3}px ${colors[colorIdx]}80`
                : "none",
              transform:  isActive ? "scale(1.25)" : "scale(1)",
            }}
          />
        );
      })}
    </div>
  );
}

/** Gold corner bolt */
function CornerBolt({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const posClass = {
    tl: "top-2.5 left-2.5",
    tr: "top-2.5 right-2.5",
    bl: "bottom-2.5 left-2.5",
    br: "bottom-2.5 right-2.5",
  }[position];

  return (
    <div
      className={`absolute ${posClass} h-4 w-4 rounded-full z-20`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #fde68a, #f59e0b, #92400e)",
        boxShadow:  "0 0 8px rgba(245,158,11,0.6), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.4)",
        border:     "1px solid rgba(245,158,11,0.5)",
      }}
    >
      {/* Cross hatch */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-2 bg-amber-900/50" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-2 w-px bg-amber-900/50" />
      </div>
    </div>
  );
}

const PAYTABLE = [
  { symbol: "7️⃣",  label: "SEVEN",   mult: "×100", color: "#ef4444", glow: "rgba(239,68,68,0.5)"   },
  { symbol: "💎",  label: "WILD",    mult: "×50",  color: "#a78bfa", glow: "rgba(167,139,250,0.5)" },
  { symbol: "🍒",  label: "CHERRY",  mult: "×20",  color: "#f43f5e", glow: "rgba(244,63,94,0.5)"   },
  { symbol: "🍉",  label: "MELON",   mult: "×10",  color: "#10b981", glow: "rgba(16,185,129,0.5)"  },
  { symbol: "⭐",  label: "STAR",    mult: "×5",   color: "#fbbf24", glow: "rgba(251,191,36,0.5)"  },
];

interface CabinetFrameProps {
  children: React.ReactNode;
}

export function CabinetFrame({ children }: CabinetFrameProps) {
  const t = useTranslations("game.cabinet");
  const { lastResult, bonus, spinState } = useGameStore();
  const { balance } = useWalletStore();

  const win      = lastResult?.totalWin ?? 0;
  const isWin    = win > 0 && spinState !== "animating";
  const isBigWin = win > 50;
  const isMega   = win > 150;

  return (
    <div className="relative w-full max-w-full select-none overflow-hidden" style={{ perspective: "1600px" }}>
      {/* ── Outer ambient glow ───────────────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-70"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.3) 0%, rgba(236,72,153,0.12) 50%, transparent 75%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-40"
        style={{
          background: "radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.2) 0%, transparent 60%)",
          filter: "blur(16px)",
        }}
      />

      {/* ── Cabinet shell ───────────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a0b30 0%, #0a0418 35%, #150728 70%, #090315 100%)",
          boxShadow: [
            "0 0 0 1px rgba(139,92,246,0.45)",
            "0 0 0 3px rgba(0,0,0,0.9)",
            "0 0 0 5px rgba(124,58,237,0.18)",
            "0 0 80px rgba(124,58,237,0.25)",
            "0 0 120px rgba(236,72,153,0.1)",
            "0 40px 100px rgba(0,0,0,0.9)",
            "inset 0 1px 0 rgba(255,255,255,0.12)",
            "inset 0 -1px 0 rgba(0,0,0,0.6)",
          ].join(", "),
        }}
      >
        {/* Corner bolts */}
        <CornerBolt position="tl" />
        <CornerBolt position="tr" />
        <CornerBolt position="bl" />
        <CornerBolt position="br" />

        {/* ── Neon top edge ───────────────────────────────────────────────── */}
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 via-fuchsia-400 via-40% to-amber-400"
          style={{ boxShadow: "0 0 20px rgba(167,139,250,0.8), 0 0 40px rgba(236,72,153,0.4)" }} />

        {/* ── Top LED strip ───────────────────────────────────────────────── */}
        <div className="py-2 px-2 border-b border-white/[0.05] overflow-hidden"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          <LedStrip count={24} size={6} />
        </div>

        {/* ── Brand header ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center gap-3 py-2 border-b border-white/[0.05]"
          style={{ background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(124,58,237,0.15) 50%, rgba(0,0,0,0) 100%)" }}
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-500/50" />
          <div className="flex items-center gap-2">
            <Image
              src="/images/midnight-riches-logo.png"
              alt=""
              width={18}
              height={18}
              className="object-contain opacity-85 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
            />
            <span
              className="text-[12px] font-black tracking-[0.28em] uppercase"
              style={{
                background: "linear-gradient(90deg, #c4b5fd, #fbbf24, #f472b6, #c4b5fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundSize: "200% auto",
              }}
            >
              Midnight Riches
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-500/50" />
        </div>

        {/* ── Paytable strip ──────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center border-b border-white/[0.05]"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          {PAYTABLE.map((row, i) => (
            <div
              key={i}
              className="flex flex-1 items-center justify-center gap-1 border-r border-white/[0.05] last:border-r-0 px-1 py-1.5 sm:gap-1.5 sm:px-2 sm:py-2"
            >
              <span className="text-[13px] leading-none sm:text-[17px]">{row.symbol}</span>
              <div className="text-right">
                <div className="text-[5px] font-bold uppercase tracking-widest text-white/20 sm:text-[6.5px]">{row.label}</div>
                <div
                  className="text-[10px] font-black leading-none sm:text-[12px]"
                  style={{ color: row.color, textShadow: `0 0 8px ${row.glow}` }}
                >
                  {row.mult}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Side neon bars + reel area ───────────────────────────────────── */}
        <div className="relative flex">
          {/* Left neon bar */}
          <div className="w-5 shrink-0 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(124,58,237,0.95), rgba(236,72,153,0.75), rgba(245,158,11,0.55), rgba(16,185,129,0.45))",
                boxShadow: "4px 0 24px rgba(124,58,237,0.8)",
              }}
            />
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="absolute left-0 right-0 h-px bg-white/15"
                style={{ top: `${(i + 1) * 9.09}%` }} />
            ))}
          </div>

          {/* Main reel area */}
          <div
            className="flex-1 relative px-1.5 py-2.5 flex items-center justify-center"
            style={{
              backgroundImage: "url('/images/slot-machine.avif')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                boxShadow: [
                  "inset 0 0 50px rgba(0,0,0,0.6)",
                  "inset 0 0 90px rgba(0,20,60,0.35)",
                  "inset 0 3px 10px rgba(0,0,0,0.6)",
                  "inset 0 -3px 10px rgba(0,0,0,0.6)",
                ].join(", "),
              }}
            >
              {/* CRT scanlines */}
              <div
                className="pointer-events-none absolute inset-0 z-10 rounded-xl"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px)",
                  mixBlendMode: "overlay",
                }}
              />

              {/* Corner vignette */}
              <div
                className="pointer-events-none absolute inset-0 z-10 rounded-xl"
                style={{
                  background: "radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
                }}
              />

              {/* Win flash */}
              <AnimatePresence>
                {isWin && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.22, 0, 0.16, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.0, times: [0, 0.2, 0.4, 0.65, 1] }}
                    className="pointer-events-none absolute inset-0 z-20 rounded-xl"
                    style={{
                      background: isBigWin
                        ? "rgba(251,191,36,0.75)"
                        : "rgba(52,211,153,0.55)",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* MEGA WIN overlay */}
              <AnimatePresence>
                {isMega && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    transition={{ type: "spring", bounce: 0.45, duration: 0.55 }}
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl"
                  >
                    <div className="relative">
                      <div
                        className="text-5xl font-black tracking-tight px-8 py-4 rounded-2xl"
                        style={{
                          background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          filter: "drop-shadow(0 0 30px rgba(251,191,36,0.9)) drop-shadow(0 0 60px rgba(251,191,36,0.5))",
                        }}
                      >
                        {t("megaWin")}
                      </div>
                      {/* Coin burst dots */}
                      {Array.from({ length: 8 }, (_, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                          animate={{
                            x: Math.cos((i / 8) * Math.PI * 2) * 60,
                            y: Math.sin((i / 8) * Math.PI * 2) * 60,
                            opacity: 0,
                            scale: 0.5,
                          }}
                          transition={{ duration: 0.7, delay: 0.1 }}
                          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{ background: "#fbbf24", boxShadow: "0 0 8px #f59e0b" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BIG WIN overlay (non-mega) */}
              <AnimatePresence>
                {isBigWin && !isMega && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.2 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.5 }}
                    className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl"
                  >
                    <div
                      className="text-4xl font-black tracking-tight"
                      style={{
                        background: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        filter: "drop-shadow(0 0 20px rgba(251,191,36,0.8))",
                      }}
                    >
                      {t("bigWin")}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {children}
            </div>
          </div>

          {/* Right neon bar */}
          <div className="w-5 shrink-0 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(to bottom, rgba(16,185,129,0.45), rgba(245,158,11,0.55), rgba(236,72,153,0.75), rgba(124,58,237,0.95))",
                boxShadow: "-4px 0 24px rgba(236,72,153,0.7)",
              }}
            />
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="absolute left-0 right-0 h-px bg-white/15"
                style={{ top: `${(i + 1) * 9.09}%` }} />
            ))}
          </div>
        </div>

        {/* ── Stats display ──────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-3 divide-x divide-white/[0.05] border-t border-white/[0.05]"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(8,2,20,0.85) 100%)" }}
        >
          {[
            {
              label: t("balance"),
              value: balance,
              color: "#fbbf24",
              glow: "rgba(251,191,36,0.5)",
              raw: false,
            },
            {
              label: bonus.isActive ? t("freeSpins") : t("win"),
              value: bonus.isActive ? bonus.spinsRemaining : win,
              color: bonus.isActive ? "#f472b6" : win > 0 ? "#34d399" : "#34d39955",
              glow:  bonus.isActive ? "rgba(244,114,182,0.5)" : "rgba(52,211,153,0.35)",
              raw:   bonus.isActive,
            },
            {
              label: bonus.isActive ? t("bonusWin") : t("totalBet"),
              value: bonus.isActive ? bonus.totalBonusWin : 0,
              color: "#a78bfa",
              glow: "rgba(167,139,250,0.4)",
              raw:  false,
            },
          ].map(({ label, value, color, glow, raw }, i) => (
            <div key={i} className="flex flex-col items-center py-3 px-2">
              <div className="text-[7.5px] font-bold uppercase tracking-[0.2em] text-white/18">{label}</div>
              <div
                className="mt-0.5 text-[16px] font-black leading-tight tabular-nums"
                style={{
                  color,
                  textShadow: `0 0 14px ${glow}`,
                  fontFamily: "'Courier New', Courier, monospace",
                  letterSpacing: "0.02em",
                }}
              >
                {raw ? (
                  <span>{value as number}</span>
                ) : (
                  <RollingNumber value={value as number} suffix=" cr" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom LED strip ───────────────────────────────────────────────── */}
        <div className="py-2 px-2 border-t border-white/[0.05] overflow-hidden"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          <LedStrip count={24} size={6} />
        </div>

        {/* ── Neon bottom edge ───────────────────────────────────────────────── */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-fuchsia-400 to-violet-500"
          style={{ boxShadow: "0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(236,72,153,0.3)" }} />
      </div>

      {/* ── Floor reflection glow ──────────────────────────────────────────── */}
      <div
        className="absolute left-4 right-4 -bottom-5 h-12 rounded-full opacity-35 blur-2xl"
        style={{ background: "linear-gradient(to right, #7c3aed, #ec4899, #f59e0b)" }}
      />
      <div
        className="absolute left-16 right-16 -bottom-8 h-8 rounded-full opacity-18 blur-3xl"
        style={{ background: "linear-gradient(to right, #ec4899, #7c3aed)" }}
      />
    </div>
  );
}
