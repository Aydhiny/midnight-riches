"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import ShinyButton from "@/components/ui/shiny-button";
import { useConversionTracker } from "@/lib/analytics/conversion";

// ── Symbol data ───────────────────────────────────────────────────────────────
interface SlotSymbol { id: string; src: string; label: string; payout: number; }

const SYMBOLS: SlotSymbol[] = [
  { id: "cherry",     src: "/images/Cherry.png",     label: "Cherry",  payout: 5   },
  { id: "lemon",      src: "/images/Lemon.png",       label: "Lemon",   payout: 8   },
  { id: "bell",       src: "/images/Bell.png",        label: "Bell",    payout: 12  },
  { id: "watermelon", src: "/images/Watermelon.png",  label: "Melon",   payout: 20  },
  { id: "star",       src: "/images/Star.png",        label: "Star",    payout: 35  },
  { id: "diamond",    src: "/images/Diamond.png",     label: "Diamond", payout: 55  },
  { id: "seven",      src: "/images/Seven.png",       label: "Seven",   payout: 100 },
  { id: "wild",       src: "/images/Wild.png",        label: "Wild",    payout: 200 },
];

const INITIAL_GRID: SlotSymbol[][] = [
  [SYMBOLS[0], SYMBOLS[2], SYMBOLS[4]],
  [SYMBOLS[1], SYMBOLS[3], SYMBOLS[5]],
  [SYMBOLS[6], SYMBOLS[0], SYMBOLS[2]],
];

const COIN_TRAJECTORIES = [
  { left: "15%", y: -130, rotate: 25,  delay: 0.00 },
  { left: "35%", y: -150, rotate: -18, delay: 0.05 },
  { left: "50%", y: -120, rotate: 30,  delay: 0.03 },
  { left: "68%", y: -145, rotate: -25, delay: 0.08 },
  { left: "82%", y: -125, rotate: 20,  delay: 0.06 },
];

function randomSymbol(): SlotSymbol {
  const weights = [30, 25, 20, 12, 7, 4, 1.5, 0.5];
  const total   = weights.reduce((a, b) => a + b, 0);
  let r         = Math.random() * total;
  for (let i = 0; i < SYMBOLS.length; i++) {
    r -= weights[i];
    if (r <= 0) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

function generateGrid(): SlotSymbol[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => randomSymbol())
  );
}

function checkWin(grid: SlotSymbol[][]): number {
  const mid = grid.map((reel) => reel[1]);
  if (mid[0].id === mid[1].id && mid[1].id === mid[2].id) return mid[0].payout;
  if (
    mid.some((s) => s.id === "wild") &&
    new Set(mid.map((s) => (s.id === "wild" ? "X" : s.id))).size === 1
  ) return mid[0].payout * 3;
  return 0;
}

// ── LED strip — same as real cabinet-frame.tsx ────────────────────────────────
function LedStrip({ count = 22 }: { count?: number }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % count), 80);
    return () => clearInterval(id);
  }, [count]);
  const colors = ["#fbbf24", "#f59e0b", "#ec4899", "#a855f7", "#7c3aed", "#10b981"];
  return (
    <div className="flex items-center justify-center gap-[3px] py-1.5 px-3">
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === phase || i === (phase + Math.floor(count / 2)) % count;
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: 5, height: 5,
              background: isActive ? colors[i % colors.length] : "rgba(255,255,255,0.1)",
              boxShadow: isActive ? `0 0 5px ${colors[i % colors.length]}, 0 0 10px ${colors[i % colors.length]}66` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// ── Reel cell — exact same visual language as real reel.tsx ───────────────────
const DEMO_CELL_H  = 92;
const DEMO_SYMBOL  = 76;
const DEMO_CELL_GAP = 3;

function DemoReelCell({
  symbol,
  isSpinning,
  isWin,
}: {
  symbol: SlotSymbol;
  isSpinning: boolean;
  isWin: boolean;
}) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden shrink-0"
      style={{
        height: DEMO_CELL_H,
        borderRadius: 8,
        margin: `${DEMO_CELL_GAP / 2}px 3px`,
        background: isWin
          ? "linear-gradient(180deg, rgba(255,210,0,0.22) 0%, rgba(0,8,30,0.45) 55%, rgba(0,0,18,0.6) 100%)"
          : isSpinning
          ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,8,30,0.45) 55%, rgba(0,0,18,0.6) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(0,12,40,0.28) 55%, rgba(0,0,18,0.45) 100%)",
        border: isWin
          ? "1.5px solid rgba(255,210,0,0.9)"
          : "1px solid rgba(255,255,255,0.16)",
        boxShadow: isWin
          ? "0 0 22px rgba(255,210,0,0.55), 0 0 8px rgba(255,210,0,0.35), inset 0 0 18px rgba(255,200,0,0.15), inset 0 1px 0 rgba(255,255,255,0.38), inset 0 -1px 0 rgba(0,0,0,0.45)"
          : "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.42), inset 0 0 14px rgba(0,0,0,0.22)",
        transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{ height: "32%", borderRadius: "8px 8px 0 0", background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)" }}
      />
      {/* Bottom shadow */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{ height: "26%", borderRadius: "0 0 8px 8px", background: "linear-gradient(0deg, rgba(0,0,20,0.40) 0%, transparent 100%)" }}
      />
      {/* Win pulse */}
      {isWin && (
        <div className="absolute inset-0 animate-pulse pointer-events-none rounded-lg"
          style={{ background: "rgba(255,210,0,0.08)" }} />
      )}
      {/* Symbol */}
      <div
        className="relative z-10"
        style={{
          filter: isSpinning
            ? "blur(2px) brightness(0.75)"
            : isWin
            ? "drop-shadow(0 0 10px rgba(255,210,0,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.7)) brightness(1.15)"
            : "drop-shadow(0 3px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(124,58,237,0.4)) brightness(1.08)",
          transition: "filter 0.15s ease",
        }}
      >
        <Image
          src={symbol.src}
          alt={symbol.label}
          width={DEMO_SYMBOL}
          height={DEMO_SYMBOL}
          className="object-contain"
          draggable={false}
        />
      </div>
    </div>
  );
}

// ── Reel column — same chrome/steel aesthetic as reel.tsx ─────────────────────
function DemoReel({
  symbols,
  isSpinning,
  reelIndex,
  winningRow,
}: {
  symbols: SlotSymbol[];
  isSpinning: boolean;
  reelIndex: number;
  winningRow: boolean;
}) {
  const containerH = symbols.length * (DEMO_CELL_H + DEMO_CELL_GAP) + 10;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 106,
        height: containerH,
        borderRadius: 12,
        background: "linear-gradient(180deg, #c4d6e8 0%, #7a9fc5 15%, #3c6490 35%, #1a3a5e 50%, #3c6490 65%, #7a9fc5 85%, #c4d6e8 100%)",
        boxShadow: [
          "0 0 0 1px rgba(0,0,0,0.75)",
          "0 0 0 3px rgba(138,172,206,0.85)",
          "0 0 0 4px rgba(221,232,245,0.45)",
          "0 0 0 6px rgba(124,58,237,0.65)",
          "0 0 0 7px rgba(167,139,250,0.38)",
          "inset 0 2px 4px rgba(255,255,255,0.14)",
          "inset 0 -2px 4px rgba(0,0,0,0.32)",
          "0 8px 24px rgba(0,0,0,0.6)",
        ].join(", "),
      }}
    >
      {/* Edge shadows — same as reel.tsx */}
      <div className="absolute top-0 bottom-0 left-0 w-2.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
      <div className="absolute top-0 bottom-0 right-0 w-2.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 top-0 h-3.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-3.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

      {/* Row dividers */}
      {symbols.slice(0, -1).map((_, i) => (
        <div key={i} className="absolute inset-x-2 h-px pointer-events-none z-30"
          style={{
            top: `calc(${((i + 1) / symbols.length) * 100}%)`,
            background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.38) 20%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.38) 80%, transparent 100%)",
          }}
        />
      ))}

      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div
            key="spinning"
            className="flex flex-col items-center py-1"
            animate={{ y: [0, -(DEMO_CELL_H + DEMO_CELL_GAP) * symbols.length, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, ease: "linear", delay: reelIndex * 0.1 }}
          >
            {[...symbols, ...symbols].map((sym, idx) => (
              <DemoReelCell key={idx} symbol={sym} isSpinning={true} isWin={false} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="stopped"
            className="flex flex-col items-center py-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: reelIndex * 0.12, type: "spring", stiffness: 300 }}
          >
            {symbols.map((sym, idx) => (
              <DemoReelCell
                key={idx}
                symbol={sym}
                isSpinning={false}
                isWin={winningRow && idx === 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DemoSlot() {
  const t           = useTranslations("landing.demo");
  const { track }   = useConversionTracker();

  const [grid,        setGrid]       = useState<SlotSymbol[][]>(INITIAL_GRID);
  const [spinning,    setSpinning]   = useState(false);
  const [balance,     setBalance]    = useState(1000);
  const [lastWin,     setLastWin]    = useState(0);
  const [spinCount,   setSpinCount]  = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalWon,    setTotalWon]   = useState(0);
  const [winningRow,  setWinningRow] = useState(false);
  const [showWinFlash, setShowWinFlash] = useState(false);

  const spinTimeouts = useRef<NodeJS.Timeout[]>([]);
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timeouts = spinTimeouts.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const spin = useCallback(() => {
    if (spinning) return;
    const bet = 10;
    if (balance < bet) { setBalance(1000); return; }

    setSpinning(true);
    setWinningRow(false);
    setShowWinFlash(false);
    setBalance((b) => b - bet);
    setLastWin(0);
    track("demo_spin", { spinNumber: spinCount + 1 });

    try {
      const audio = new Audio("/sounds/slot-spin.mp3");
      audio.loop  = true;
      audio.play().catch(() => {});
      spinAudioRef.current = audio;
    } catch { /* ignore */ }

    let ticks = 0;
    const interval = setInterval(() => {
      setGrid(generateGrid());
      ticks++;
      if (ticks >= 14) {
        clearInterval(interval);
        const final = generateGrid();
        if ((spinCount + 1) % 3 === 0) {
          const ws = SYMBOLS[Math.floor(Math.random() * 5)];
          final[0][1] = { ...ws };
          final[1][1] = { ...ws };
          final[2][1] = { ...ws };
        }
        setGrid(final);
        const win = checkWin(final);

        if (spinAudioRef.current) {
          spinAudioRef.current.pause();
          spinAudioRef.current.currentTime = 0;
          spinAudioRef.current = null;
        }

        if (win > 0) {
          setLastWin(win);
          setBalance((b) => b + win);
          setTotalWon((w) => w + win);
          setWinningRow(true);
          setShowWinFlash(true);
          try {
            const a = new Audio("/sounds/jackpot.mp3");
            a.volume = 0.55;
            a.play().catch(() => {});
          } catch { /* ignore */ }
          const t1 = setTimeout(() => setShowWinFlash(false), 1800);
          spinTimeouts.current.push(t1);
        }

        setSpinning(false);
        setSpinCount((c) => {
          const next = c + 1;
          if (next === 5) {
            const t2 = setTimeout(() => setShowOverlay(true), 800);
            spinTimeouts.current.push(t2);
          }
          return next;
        });
      }
    }, 70);
    spinTimeouts.current.push(interval as unknown as NodeJS.Timeout);
  }, [spinning, balance, spinCount, track]);

  return (
    <div
      className="relative w-full max-w-md select-none"
      style={{
        filter: winningRow
          ? "drop-shadow(0 0 50px rgba(251,191,36,0.4))"
          : "drop-shadow(0 0 30px rgba(124,58,237,0.3))",
        transition: "filter 0.5s ease",
      }}
    >
      {/* ── OUTER CABINET — mirrors reel.tsx chrome/steel aesthetic ─────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(175deg, #18082e 0%, #0b0118 50%, #070011 100%)",
          boxShadow: [
            "0 0 0 1px rgba(0,0,0,0.85)",
            "0 0 0 3px rgba(138,172,206,0.55)",
            "0 0 0 4px rgba(200,220,245,0.22)",
            "0 0 0 6px rgba(124,58,237,0.55)",
            "0 0 0 7px rgba(140,100,220,0.28)",
            "0 24px 80px rgba(0,0,0,0.9)",
            "0 0 60px rgba(124,58,237,0.18)",
            "inset 0 2px 0 rgba(255,255,255,0.06)",
          ].join(", "),
        }}
      >
        {/* Corner gold bolts */}
        {(["top-0 left-0 rounded-tl-3xl", "top-0 right-0 rounded-tr-3xl",
           "bottom-0 left-0 rounded-bl-3xl", "bottom-0 right-0 rounded-br-3xl"] as const
        ).map((cls, i) => (
          <div
            key={i}
            className={`absolute ${cls} w-4 h-4 z-20 pointer-events-none`}
            style={{
              background: `linear-gradient(${135 + i * 90}deg, #fde68a 0%, #f59e0b 50%, #b45309 100%)`,
              boxShadow: "0 0 5px rgba(251,191,36,0.55)",
            }}
          />
        ))}

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(90deg, rgba(60,20,140,0.35), rgba(15,3,40,0.6), rgba(60,20,140,0.35))",
            borderBottom: "1px solid rgba(124,58,237,0.35)",
          }}
        >
          <div className="flex items-center justify-between px-4 py-2.5">
            {/* Left: logo + brand */}
            <div className="flex items-center gap-2">
              <Image
                src="/images/midnight-riches-logo.png"
                alt=""
                width={22}
                height={22}
                className="object-contain opacity-90 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
              />
              <span
                className="text-[10px] font-black tracking-[0.22em] uppercase"
                style={{
                  background: "linear-gradient(90deg, #a78bfa, #fbbf24, #a78bfa)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Midnight Riches
              </span>
            </div>
            {/* Right: demo badge */}
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 uppercase tracking-wider">
              {t("demoMode")}
            </span>
          </div>

          {/* LED strip top */}
          <LedStrip count={22} />
        </div>

        {/* ── REEL WINDOW ─────────────────────────────────────────────────── */}
        <div
          className="relative px-3 pt-3 pb-2"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 100%)" }}
        >
          {/* Win flash */}
          <AnimatePresence>
            {showWinFlash && (
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 1, 0] }}
                transition={{ duration: 0.6, times: [0, 0.15, 0.35, 0.55, 1] }}
                className="pointer-events-none absolute inset-0 z-40"
                style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.28) 0%, rgba(255,165,0,0.08) 70%, transparent 100%)" }}
              />
            )}
          </AnimatePresence>

          {/* WIN text */}
          <AnimatePresence>
            {showWinFlash && (
              <motion.div
                key="win-text"
                initial={{ opacity: 0, scale: 0.3, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="pointer-events-none absolute inset-x-0 z-50 flex justify-center"
                style={{ top: "42%" }}
              >
                <span
                  className="text-3xl font-black tracking-widest text-amber-400 px-4 py-1 rounded-xl"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(251,191,36,0.5)",
                    filter: "drop-shadow(0 0 16px rgba(251,191,36,1)) drop-shadow(0 0 32px rgba(251,191,36,0.6))",
                  }}
                >
                  ★ WIN ★
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coin burst */}
          <AnimatePresence>
            {showWinFlash && COIN_TRAJECTORIES.map((coin, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, y: 0, rotate: 0 }}
                animate={{ opacity: 0, y: coin.y, rotate: coin.rotate }}
                transition={{ duration: 0.85, delay: coin.delay, ease: "easeOut" }}
                className="pointer-events-none absolute z-50 text-base"
                style={{ left: coin.left, bottom: "35%" }}
              >🪙</motion.div>
            ))}
          </AnimatePresence>

          {/* The three reels side by side */}
          <div className="flex items-center justify-center gap-2">
            {grid.map((reel, col) => (
              <DemoReel
                key={col}
                symbols={reel}
                isSpinning={spinning}
                reelIndex={col}
                winningRow={winningRow}
              />
            ))}
          </div>

          {/* Payline */}
          <div className="relative h-5 mt-1">
            <div
              className="absolute inset-x-4 pointer-events-none"
              style={{
                top: "50%",
                height: 1.5,
                transform: "translateY(-50%)",
                background: winningRow
                  ? "linear-gradient(90deg, transparent, rgba(255,210,0,0.9) 10%, rgba(255,210,0,0.9) 90%, transparent)"
                  : "linear-gradient(90deg, transparent, rgba(251,191,36,0.4) 10%, rgba(251,191,36,0.4) 90%, transparent)",
                boxShadow: winningRow ? "0 0 8px rgba(255,210,0,0.8), 0 0 16px rgba(255,210,0,0.4)" : "none",
                transition: "all 0.4s ease",
              }}
            />
            {/* Payline arrows */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2" style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `5px solid ${winningRow ? "rgba(255,210,0,0.9)" : "rgba(251,191,36,0.4)"}` }} />
            <div className="absolute right-2 top-1/2 -translate-y-1/2" style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `5px solid ${winningRow ? "rgba(255,210,0,0.9)" : "rgba(251,191,36,0.4)"}` }} />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[7px] font-bold uppercase tracking-[0.2em] text-white/20">
              payline
            </div>
          </div>
        </div>

        {/* ── BOTTOM LED STRIP ────────────────────────────────────────────── */}
        <LedStrip count={22} />

        {/* ── CONTROL PANEL ───────────────────────────────────────────────── */}
        <div
          className="px-4 pb-5 pt-3"
          style={{
            background: "linear-gradient(180deg, rgba(8,1,20,0.85) 0%, rgba(4,0,12,0.97) 100%)",
            borderTop: "1px solid rgba(80,40,180,0.3)",
          }}
        >
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {/* Balance */}
            <div
              className="flex flex-col items-center rounded-lg py-2"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(251,191,36,0.2)", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.5)" }}
            >
              <div className="text-[7px] font-black uppercase tracking-[0.18em] text-white/30 mb-0.5">{t("balance")}</div>
              <div
                className="text-[15px] font-black tabular-nums leading-none text-amber-400"
                style={{ textShadow: "0 0 10px rgba(251,191,36,0.7)" }}
              >
                {balance.toLocaleString()}
              </div>
            </div>

            {/* Bet */}
            <div
              className="flex flex-col items-center rounded-lg py-2"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <div className="text-[7px] font-black uppercase tracking-[0.18em] text-white/30 mb-0.5">BET</div>
              <div
                className="text-[15px] font-black tabular-nums leading-none text-violet-400"
                style={{ textShadow: "0 0 10px rgba(124,58,237,0.7)" }}
              >10</div>
            </div>

            {/* Win */}
            <div
              className="flex flex-col items-center rounded-lg py-2"
              style={{
                background: "rgba(0,0,0,0.45)",
                border: `1px solid ${lastWin > 0 ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.12)"}`,
                transition: "border-color 0.3s ease",
              }}
            >
              <div className="text-[7px] font-black uppercase tracking-[0.18em] text-white/30 mb-0.5">{t("win")}</div>
              <AnimatePresence mode="popLayout">
                {lastWin > 0 ? (
                  <motion.div
                    key="win-amount"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[15px] font-black tabular-nums leading-none text-emerald-400"
                    style={{ textShadow: "0 0 10px rgba(52,211,153,0.8)" }}
                  >
                    +{lastWin}
                  </motion.div>
                ) : (
                  <motion.div key="no-win" className="text-[15px] font-black leading-none text-white/20">---</motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SPIN button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="relative w-full overflow-hidden rounded-xl py-3.5 font-black text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: spinning
                ? "linear-gradient(135deg, #7a4800, #9a6000)"
                : "linear-gradient(135deg, #fbbf24 0%, #fde68a 45%, #f59e0b 100%)",
              boxShadow: spinning
                ? "none"
                : "0 0 24px rgba(251,191,36,0.5), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
              color: spinning ? "#c88a20" : "#1a0800",
            }}
          >
            {/* Shimmer sweep when idle */}
            {!spinning && (
              <span
                className="absolute inset-0 -skew-x-12 -translate-x-full"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                  animation: "shimmerPass 2.2s ease-in-out infinite",
                }}
              />
            )}
            <style>{`@keyframes shimmerPass { 0%,40%{transform:skewX(-12deg) translateX(-200%)} 60%,100%{transform:skewX(-12deg) translateX(300%)} }`}</style>

            <span className="relative flex items-center justify-center gap-2 text-base font-black">
              {spinning ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                  {t("spinning")}
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {t("spin")}
                </>
              )}
            </span>
          </button>
        </div>

        {/* ── SIGNUP OVERLAY after 5 spins ─────────────────────────────────── */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl p-6 text-center"
              style={{ background: "rgba(5,1,14,0.94)", backdropFilter: "blur(18px)" }}
            >
              <Sparkles className="h-12 w-12 text-amber-400" />
              <h3 className="mt-3 text-2xl font-black text-amber-400">{t("overlayTitle")}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {t("overlayDescription", { credits: totalWon })}
              </p>
              <Link
                href="/auth/signup"
                onClick={() => track("cta_click", { section: "demo_overlay", button: "signup" })}
                className="mt-5"
              >
                <ShinyButton className="h-12 px-8 text-base">{t("overlayCta")}</ShinyButton>
              </Link>
              <button
                onClick={() => setShowOverlay(false)}
                className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {t("overlayDismiss")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
