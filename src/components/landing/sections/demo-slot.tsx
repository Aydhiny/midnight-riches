"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Sparkles } from "lucide-react";
import ShinyButton from "@/components/ui/shiny-button";
import { useConversionTracker } from "@/lib/analytics/conversion";

interface SlotSymbol {
  id: string;
  src: string;
  label: string;
  payout: number;
}

const SYMBOLS: SlotSymbol[] = [
  { id: "cherry",     src: "/images/Cherry.png",     label: "Cherry",     payout: 5   },
  { id: "lemon",      src: "/images/Lemon.png",       label: "Lemon",      payout: 8   },
  { id: "bell",       src: "/images/Bell.png",        label: "Bell",       payout: 12  },
  { id: "watermelon", src: "/images/Watermelon.png",  label: "Melon",      payout: 20  },
  { id: "star",       src: "/images/Star.png",        label: "Star",       payout: 35  },
  { id: "diamond",    src: "/images/Diamond.png",     label: "Diamond",    payout: 55  },
  { id: "seven",      src: "/images/Seven.png",       label: "Seven",      payout: 100 },
  { id: "wild",       src: "/images/Wild.png",        label: "Wild",       payout: 200 },
];

// Pre-defined coin trajectories — no Math.random() in render
const COIN_TRAJECTORIES = [
  { left: "12%", y: -140, rotate: 25,  delay: 0.00 },
  { left: "24%", y: -160, rotate: -18, delay: 0.05 },
  { left: "35%", y: -120, rotate: 40,  delay: 0.10 },
  { left: "46%", y: -170, rotate: -30, delay: 0.00 },
  { left: "55%", y: -145, rotate: 20,  delay: 0.08 },
  { left: "65%", y: -155, rotate: -40, delay: 0.03 },
  { left: "74%", y: -130, rotate: 30,  delay: 0.12 },
  { left: "82%", y: -165, rotate: -15, delay: 0.06 },
  { left: "20%", y: -110, rotate: 35,  delay: 0.15 },
  { left: "70%", y: -175, rotate: -25, delay: 0.09 },
];

function randomSymbol(): SlotSymbol {
  // Weight toward lower-payout symbols for realism
  const weights = [30, 25, 20, 12, 7, 4, 1.5, 0.5];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
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
  // Check middle row (payline)
  const mid = grid.map((reel) => reel[1]);
  if (mid[0].id === mid[1].id && mid[1].id === mid[2].id) return mid[0].payout;
  // Wild wins
  if (mid.some((s) => s.id === "wild") && new Set(mid.map((s) => s.id === "wild" ? "X" : s.id)).size === 1) return mid[0].payout * 3;
  return 0;
}

// ─── Draggable Lever ─────────────────────────────────────────────────────────
function SlotLever({ onPull, disabled }: { onPull: () => void; disabled: boolean }) {
  const y = useMotionValue(0);
  const MAX_PULL = 80;
  const isDragging = useRef(false);
  const didTrigger = useRef(false);

  const handleBg = useTransform(y, [0, MAX_PULL], ["#7c3aed", "#f59e0b"]);
  const knobY = useTransform(y, [0, MAX_PULL], [0, MAX_PULL]);

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    didTrigger.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current || disabled) return;
    const next = Math.max(0, Math.min(MAX_PULL, y.get() + e.movementY));
    y.set(next);
    if (next >= MAX_PULL * 0.85 && !didTrigger.current) {
      didTrigger.current = true;
      onPull();
    }
  }

  function onPointerUp() {
    isDragging.current = false;
    // Spring back
    animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
  }

  return (
    <div className="relative flex flex-col items-center select-none" style={{ width: 36, height: 120 }}>
      {/* Track */}
      <div className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 w-2 rounded-full bg-white/10 border border-white/10" />

      {/* Ball cap at top */}
      <motion.div
        style={{ backgroundColor: handleBg, y: knobY }}
        className="relative z-10 cursor-grab active:cursor-grabbing w-8 h-8 rounded-full shadow-[0_0_16px_rgba(124,58,237,0.6)] flex items-center justify-center border border-white/20 touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        whileHover={!disabled ? { scale: 1.12 } : undefined}
      >
        <div className="w-3 h-3 rounded-full bg-white/30" />
      </motion.div>

      {/* PULL label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-white/30 rotate-90 origin-center whitespace-nowrap" style={{ marginLeft: 20 }}>
        PULL
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export function DemoSlot() {
  const t = useTranslations("landing.demo");
  const { track } = useConversionTracker();
  const [grid, setGrid] = useState(() => generateGrid());
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(1000);
  const [lastWin, setLastWin] = useState(0);
  const [spinCount, setSpinCount] = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalWon, setTotalWon] = useState(0);
  const [winningRow, setWinningRow] = useState(false);
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
    if (balance < bet) {
      setBalance(1000);
      return;
    }

    setSpinning(true);
    setWinningRow(false);
    setShowWinFlash(false);
    setBalance((b) => b - bet);
    setLastWin(0);
    track("demo_spin", { spinNumber: spinCount + 1 });

    // Play spin sound
    try {
      const spinAudio = new Audio("/sounds/slot-spin.mp3");
      spinAudio.loop = true;
      spinAudio.play().catch(() => {});
      spinAudioRef.current = spinAudio;
    } catch {
      // ignore
    }

    let ticks = 0;
    const animInterval = setInterval(() => {
      setGrid(generateGrid());
      ticks++;
      if (ticks >= 14) {
        clearInterval(animInterval);
        const finalGrid = generateGrid();
        // Every 3rd spin guarantee a win for engagement
        if ((spinCount + 1) % 3 === 0) {
          const winSymbol = SYMBOLS[Math.floor(Math.random() * 5)];
          finalGrid[0][1] = { ...winSymbol };
          finalGrid[1][1] = { ...winSymbol };
          finalGrid[2][1] = { ...winSymbol };
        }
        setGrid(finalGrid);
        const win = checkWin(finalGrid);

        // Stop spin sound
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

          // Play jackpot sound
          try {
            const jackpotAudio = new Audio("/sounds/jackpot.mp3");
            jackpotAudio.volume = 0.55;
            jackpotAudio.play().catch(() => {});
          } catch {
            // ignore
          }

          // Auto-clear the win flash
          const flashTo = setTimeout(() => setShowWinFlash(false), 1800);
          spinTimeouts.current.push(flashTo);
        }
        setSpinning(false);
        setSpinCount((c) => {
          const next = c + 1;
          if (next === 5) {
            const to = setTimeout(() => setShowOverlay(true), 800);
            spinTimeouts.current.push(to);
          }
          return next;
        });
      }
    }, 70);
    spinTimeouts.current.push(animInterval as unknown as NodeJS.Timeout);
  }, [spinning, balance, spinCount, track]);

  return (
    <div
      className="relative w-full max-w-md select-none"
      style={{
        /* Outer ambient glow */
        filter: winningRow
          ? "drop-shadow(0 0 40px rgba(251,191,36,0.35))"
          : "drop-shadow(0 0 28px rgba(124,58,237,0.25))",
        transition: "filter 0.5s ease",
      }}
    >
      {/* ── Cabinet outer frame ──────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0e0624 0%, #060214 100%)",
          /* 5-layer chrome border matching CabinetRenderer */
          boxShadow: [
            "0 0 0 1px rgba(0,0,0,0.8)",
            "0 0 0 3px rgba(138,172,206,0.85)",
            "0 0 0 4px rgba(221,232,245,0.45)",
            "0 0 0 6px rgba(124,58,237,0.65)",
            "0 0 0 7px rgba(167,139,250,0.4)",
            "0 8px 60px rgba(0,0,0,0.7)",
          ].join(", "),
        }}
      >
        {/* Golden corner accents */}
        {([
          "top-0 left-0 rounded-tl-2xl rounded-br-sm",
          "top-0 right-0 rounded-tr-2xl rounded-bl-sm",
          "bottom-0 left-0 rounded-bl-2xl rounded-tr-sm",
          "bottom-0 right-0 rounded-br-2xl rounded-tl-sm",
        ] as const).map((cls, i) => (
          <div
            key={i}
            className={`absolute ${cls} w-5 h-5 z-20 pointer-events-none`}
            style={{
              background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)",
              boxShadow: "0 0 6px rgba(251,191,36,0.6)",
            }}
          />
        ))}

        {/* Golden flash overlay on win */}
        <AnimatePresence>
          {showWinFlash && (
            <motion.div
              key="win-flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.6, 1, 0] }}
              transition={{ duration: 0.6, times: [0, 0.15, 0.35, 0.55, 1] }}
              className="pointer-events-none absolute inset-0 z-40 rounded-2xl"
              style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.28) 0%, rgba(255,165,0,0.08) 70%, transparent 100%)" }}
            />
          )}
        </AnimatePresence>

        {/* Coin particles on win */}
        <AnimatePresence>
          {showWinFlash &&
            COIN_TRAJECTORIES.map((coin, i) => (
              <motion.div
                key={`coin-${i}`}
                initial={{ opacity: 1, y: 0, rotate: 0, scale: 1.1 }}
                animate={{ opacity: 0, y: coin.y, rotate: coin.rotate, scale: 0.6 }}
                transition={{ duration: 0.9, delay: coin.delay, ease: "easeOut" }}
                className="pointer-events-none absolute z-50 text-lg"
                style={{ left: coin.left, bottom: "30%" }}
              >
                🪙
              </motion.div>
            ))}
        </AnimatePresence>

        {/* ★ WIN ★ pop text */}
        <AnimatePresence>
          {showWinFlash && (
            <motion.div
              key="win-text"
              initial={{ opacity: 0, scale: 0.3, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="pointer-events-none absolute inset-x-0 z-50 flex justify-center"
              style={{ top: "38%" }}
            >
              <span
                className="text-4xl font-black tracking-widest text-amber-400 px-4 py-1 rounded-xl"
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

        {/* ── Title strip ──────────────────────────────────────────────── */}
        <div
          className="relative flex items-center justify-between px-4 py-2"
          style={{
            background: "linear-gradient(90deg, rgba(124,58,237,0.25) 0%, rgba(251,191,36,0.12) 50%, rgba(124,58,237,0.25) 100%)",
            borderBottom: "1px solid rgba(124,58,237,0.35)",
          }}
        >
          {/* LED dots left */}
          <div className="flex gap-1">
            {["#fbbf24","#ec4899","#7c3aed","#10b981"].map((c, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  background: c,
                  boxShadow: `0 0 5px ${c}cc`,
                  animation: `pulse ${1.2 + i * 0.3}s ease-in-out infinite alternate`,
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <span
            className="text-[11px] font-black tracking-[0.25em] uppercase"
            style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #fbbf24 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Midnight Riches
          </span>

          {/* Demo badge right */}
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold text-amber-400">
            {t("demoMode")}
          </span>
        </div>

        {/* ── Reels + Lever row ────────────────────────────────────────── */}
        <div className="flex items-stretch gap-0">

          {/* ── Chrome reel drum ─────────────────────────────────────── */}
          <div className="relative flex-1 overflow-hidden" style={{ padding: "10px 10px 6px" }}>
            {/* Chrome gradient background — the drum cylinder */}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, #c4d6e8 0%, #7a9fc5 12%, #3c6490 30%, #1a3a5e 50%, #3c6490 70%, #7a9fc5 88%, #c4d6e8 100%)",
              }}
            />

            {/* Vertical highlight glint – left */}
            <div
              className="absolute top-0 bottom-0 w-3 pointer-events-none z-10"
              style={{
                left: "6%",
                background: "linear-gradient(90deg, rgba(255,255,255,0.18) 0%, transparent 100%)",
              }}
            />
            {/* Vertical highlight glint – center-left */}
            <div
              className="absolute top-0 bottom-0 w-1.5 pointer-events-none z-10"
              style={{
                left: "14%",
                background: "linear-gradient(90deg, rgba(255,255,255,0.09) 0%, transparent 100%)",
              }}
            />

            {/* Left vignette — cylinder edge depth */}
            <div
              className="absolute top-0 bottom-0 left-0 w-10 pointer-events-none z-20"
              style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)" }}
            />
            {/* Right vignette */}
            <div
              className="absolute top-0 bottom-0 right-0 w-10 pointer-events-none z-20"
              style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 60%, transparent 100%)" }}
            />

            {/* Top depth vignette */}
            <div
              className="absolute inset-x-0 top-0 h-6 pointer-events-none z-20"
              style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
            />
            {/* Bottom depth vignette */}
            <div
              className="absolute inset-x-0 bottom-0 h-6 pointer-events-none z-20"
              style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
            />

            {/* ── 3×3 Symbol grid ────────────────────────────────────── */}
            <div className="relative z-10 grid grid-cols-3 gap-1.5">
              {grid.map((reel, col) =>
                reel.map((symbol, row) => {
                  const isPayline = row === 1;
                  const isWinCell = isPayline && winningRow;
                  return (
                    <motion.div
                      key={`${col}-${row}-${symbol.id}`}
                      animate={spinning ? { y: [0, -3, 3, -2, 2, 0] } : { y: 0 }}
                      transition={
                        spinning
                          ? { repeat: Infinity, duration: 0.08, ease: "linear" }
                          : { type: "spring", stiffness: 400, damping: 28 }
                      }
                      className="relative flex items-center justify-center overflow-hidden"
                      style={{
                        height: 82,
                        borderRadius: 10,
                        /* Cell background: dark overlay on top of chrome drum */
                        background: isWinCell
                          ? "linear-gradient(180deg, rgba(255,200,0,0.28) 0%, rgba(255,160,0,0.16) 55%, rgba(160,100,0,0.08) 100%)"
                          : "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(0,12,40,0.30) 55%, rgba(0,0,18,0.48) 100%)",
                        border: isWinCell
                          ? "1.5px solid rgba(255,210,0,0.9)"
                          : isPayline
                          ? "1px solid rgba(251,191,36,0.45)"
                          : "1px solid rgba(251,191,36,0.16)",
                        boxShadow: isWinCell
                          ? "0 0 20px rgba(255,210,0,0.55), 0 0 6px rgba(255,210,0,0.3), inset 0 0 14px rgba(255,200,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)"
                          : isPayline
                          ? "inset 0 0 10px rgba(251,191,36,0.06), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.35)"
                          : "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.35)",
                      }}
                    >
                      {/* Top shine layer */}
                      <div
                        className="absolute inset-x-0 top-0 pointer-events-none"
                        style={{
                          height: "35%",
                          borderRadius: "10px 10px 0 0",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
                        }}
                      />
                      {/* Bottom reflection layer */}
                      <div
                        className="absolute inset-x-0 bottom-0 pointer-events-none"
                        style={{
                          height: "28%",
                          borderRadius: "0 0 10px 10px",
                          background: "linear-gradient(0deg, rgba(0,0,20,0.40) 0%, transparent 100%)",
                        }}
                      />

                      {/* Win pulse bg */}
                      {isWinCell && (
                        <div
                          className="absolute inset-0 animate-pulse pointer-events-none"
                          style={{
                            borderRadius: 10,
                            background: "rgba(255,210,0,0.10)",
                          }}
                        />
                      )}

                      {/* Symbol image */}
                      <Image
                        src={symbol.src}
                        alt={symbol.label}
                        width={60}
                        height={60}
                        className="relative z-10 object-contain"
                        draggable={false}
                        style={{
                          filter: spinning
                            ? "blur(1.5px) brightness(0.85)"
                            : isWinCell
                            ? "drop-shadow(0 0 10px rgba(255,210,0,0.9)) drop-shadow(0 2px 8px rgba(0,0,0,0.7)) brightness(1.15)"
                            : "drop-shadow(0 2px 10px rgba(0,0,0,0.75)) drop-shadow(0 0 5px rgba(124,58,237,0.35)) brightness(1.05)",
                          transition: "filter 0.15s ease",
                        }}
                      />
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Column separator lines */}
            {[1, 2].map((i) => (
              <div
                key={i}
                className="absolute top-2 bottom-2 w-px pointer-events-none z-30"
                style={{
                  left: `calc(${(i / 3) * 100}% + ${i === 1 ? -1 : 0}px)`,
                  background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.5) 80%, transparent 100%)",
                }}
              />
            ))}

            {/* Row separator lines */}
            {[1, 2].map((i) => (
              <div
                key={i}
                className="absolute inset-x-2 h-px pointer-events-none z-30"
                style={{
                  top: `calc(${(i / 3) * 100}% + 10px)`,
                  background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 15%, rgba(255,255,255,0.08) 50%, rgba(0,0,0,0.45) 85%, transparent 100%)",
                }}
              />
            ))}

            {/* Payline amber line through middle row */}
            <div
              className="absolute pointer-events-none z-30"
              style={{
                top: "50%",
                left: 0,
                right: 0,
                height: 2,
                background: winningRow
                  ? "linear-gradient(90deg, transparent 0%, rgba(255,210,0,1) 20%, rgba(255,210,0,1) 80%, transparent 100%)"
                  : "linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.55) 20%, rgba(251,191,36,0.55) 80%, transparent 100%)",
                boxShadow: winningRow
                  ? "0 0 8px rgba(255,210,0,0.9), 0 0 20px rgba(255,210,0,0.4)"
                  : "0 0 4px rgba(251,191,36,0.4)",
                transition: "all 0.4s ease",
              }}
            />
            {/* Payline arrows */}
            <div className="absolute left-1 pointer-events-none z-30" style={{ top: "50%", transform: "translateY(-50%)" }}>
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `6px solid ${winningRow ? "rgba(255,210,0,0.9)" : "rgba(251,191,36,0.5)"}` }} />
            </div>
            <div className="absolute right-1 pointer-events-none z-30" style={{ top: "50%", transform: "translateY(-50%)" }}>
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `6px solid ${winningRow ? "rgba(255,210,0,0.9)" : "rgba(251,191,36,0.5)"}` }} />
            </div>
          </div>

          {/* ── Lever ───────────────────────────────────────────────── */}
          <div className="flex items-center px-2">
            <SlotLever onPull={spin} disabled={spinning} />
          </div>
        </div>

        {/* ── Bottom strip: balance + win + spin button ─────────────── */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3"
          style={{
            borderTop: "1px solid rgba(124,58,237,0.30)",
            background: "linear-gradient(90deg, rgba(124,58,237,0.12) 0%, rgba(6,1,15,0.7) 50%, rgba(124,58,237,0.12) 100%)",
          }}
        >
          {/* Balance */}
          <div className="shrink-0">
            <div className="text-[9px] uppercase tracking-widest text-white/35 font-semibold">{t("balance")}</div>
            <div className="font-black tabular-nums text-amber-400 text-xl leading-none mt-0.5"
              style={{ textShadow: "0 0 12px rgba(251,191,36,0.6)" }}>
              {balance.toLocaleString()}
            </div>
          </div>

          {/* Win display */}
          <AnimatePresence mode="popLayout">
            {lastWin > 0 && (
              <motion.div
                key="win"
                initial={{ opacity: 0, scale: 0.5, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center shrink-0"
              >
                <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-semibold">{t("win")}</div>
                <div
                  className="font-black text-emerald-300 text-xl leading-none mt-0.5"
                  style={{ textShadow: "0 0 14px rgba(52,211,153,0.8)" }}
                >
                  +{lastWin}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spin button */}
          <button
            onClick={spin}
            disabled={spinning}
            className="relative shrink-0 rounded-xl px-5 py-2.5 font-black text-sm text-black transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: spinning
                ? "linear-gradient(135deg, #9a6500, #c47e00)"
                : "linear-gradient(135deg, #fbbf24 0%, #fde68a 40%, #f59e0b 100%)",
              boxShadow: spinning
                ? "none"
                : "0 0 20px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          >
            <span className="flex items-center gap-1.5">
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  {t("spin")}
                </>
              )}
            </span>
          </button>
        </div>

        {/* Conversion Overlay */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
              style={{ background: "rgba(6,1,15,0.93)", backdropFilter: "blur(18px)" }}
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
                <ShinyButton className="h-12 px-8 text-base">
                  {t("overlayCta")}
                </ShinyButton>
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
