"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { Sparkles } from "lucide-react";
import ShinyButton from "@/components/ui/shiny-button";
import { useConversionTracker } from "@/lib/analytics/conversion";

// ── Slot data ─────────────────────────────────────────────────────────────────
interface SlotSymbol {
  id: string;
  src: string;
  label: string;
  payout: number;
}

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

const COIN_TRAJECTORIES = [
  { left: "12%", y: -140, rotate: 25,  delay: 0.00 },
  { left: "24%", y: -160, rotate: -18, delay: 0.05 },
  { left: "35%", y: -120, rotate: 40,  delay: 0.10 },
  { left: "46%", y: -170, rotate: -30, delay: 0.00 },
  { left: "55%", y: -145, rotate: 20,  delay: 0.08 },
  { left: "65%", y: -155, rotate: -40, delay: 0.03 },
  { left: "74%", y: -130, rotate: 30,  delay: 0.12 },
  { left: "82%", y: -165, rotate: -15, delay: 0.06 },
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
  )
    return mid[0].payout * 3;
  return 0;
}

const INITIAL_GRID: SlotSymbol[][] = [
  [SYMBOLS[0], SYMBOLS[2], SYMBOLS[4]],
  [SYMBOLS[1], SYMBOLS[3], SYMBOLS[5]],
  [SYMBOLS[6], SYMBOLS[0], SYMBOLS[2]],
];

// ── Arcade CSS ────────────────────────────────────────────────────────────────
const ARCADE_CSS = `
  @keyframes marquee-scroll {
    0%   { transform: translateX(100%); }
    100% { transform: translateX(-100%); }
  }
  @keyframes led-cycle {
    0%   { background-position: 0% 50%;   }
    100% { background-position: 300% 50%; }
  }
  @keyframes led-flash {
    0%, 100% { opacity: 1;   }
    50%       { opacity: 0.4; }
  }
  @keyframes seg-glow {
    0%, 100% { text-shadow: 0 0 6px rgba(251,191,36,0.7),  0 0 12px rgba(251,191,36,0.4);  }
    50%       { text-shadow: 0 0 10px rgba(251,191,36,1),   0 0 24px rgba(251,191,36,0.7);  }
  }
  @keyframes win-seg-glow {
    0%, 100% { text-shadow: 0 0 8px rgba(52,211,153,0.8),  0 0 16px rgba(52,211,153,0.5);  }
    50%       { text-shadow: 0 0 14px rgba(52,211,153,1),   0 0 28px rgba(52,211,153,0.8);  }
  }
`;

// ── Lever ─────────────────────────────────────────────────────────────────────
function SlotLever({ onPull, disabled }: { onPull: () => void; disabled: boolean }) {
  const y         = useMotionValue(0);
  const MAX_PULL  = 80;
  const isDragging = useRef(false);
  const didTrigger = useRef(false);

  const handleBg = useTransform(y, [0, MAX_PULL], ["#7c3aed", "#f59e0b"]);
  const knobY    = useTransform(y, [0, MAX_PULL], [0, MAX_PULL]);

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
    animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
  }

  return (
    <div className="relative flex flex-col items-center select-none" style={{ width: 32, height: 110 }}>
      {/* Shaft */}
      <div
        className="absolute top-2 bottom-2 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: 6,
          background: "linear-gradient(90deg, rgba(255,255,255,0.25) 0%, rgba(120,80,20,0.8) 40%, rgba(180,120,30,0.9) 60%, rgba(255,255,255,0.12) 100%)",
          boxShadow: "0 0 4px rgba(0,0,0,0.5)",
        }}
      />
      {/* Chrome ball */}
      <motion.div
        className="relative z-10 cursor-grab active:cursor-grabbing rounded-full flex items-center justify-center touch-none border border-white/20"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        whileHover={!disabled ? { scale: 1.15 } : undefined}
        style={{
          width: 26,
          height: 26,
          backgroundColor: handleBg,
          y: knobY,
          boxShadow: "0 0 10px rgba(124,58,237,0.6), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.4)",
        }}
      >
        <div className="w-2 h-2 rounded-full bg-white/30" />
      </motion.div>

      {/* PULL label rotated */}
      <div
        className="absolute bottom-0 left-1/2 text-[7px] font-black uppercase tracking-widest text-white/30"
        style={{ transform: "translateX(-50%) rotate(90deg) translateX(50%)", transformOrigin: "50% 100%", whiteSpace: "nowrap", marginBottom: -2 }}
      >
        PULL
      </div>
    </div>
  );
}

// ── LED marquee ───────────────────────────────────────────────────────────────
function Marquee({ jackpot, totalWon }: { jackpot: number; totalWon: number }) {
  const text = `🎰 MIDNIGHT RICHES  ★  JACKPOT: ${jackpot.toLocaleString()} CREDITS  ★  FREE DEMO — NO DEPOSIT  ★  YOUR WINNINGS SO FAR: ${totalWon.toLocaleString()} CR  ★  SPIN TO WIN  ★  `;
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "linear-gradient(90deg, #0a0118, #0f0225, #0a0118)",
        borderBottom: "1px solid rgba(251,191,36,0.25)",
        height: 26,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        className="whitespace-nowrap text-[10px] font-bold tracking-wider"
        style={{
          animation: "marquee-scroll 22s linear infinite",
          color: "#fbbf24",
          textShadow: "0 0 8px rgba(251,191,36,0.7)",
        }}
      >
        {text}{text}
      </div>
    </div>
  );
}

// ── LED strip ─────────────────────────────────────────────────────────────────
function LedStrip({ win }: { win: boolean }) {
  return (
    <div
      style={{
        height: 4,
        backgroundImage: win
          ? "linear-gradient(90deg, #ffd700, #ffec00, #ffd700, #ffec00)"
          : "linear-gradient(90deg, #ff2200, #ff7700, #ffdd00, #00ff88, #00aaff, #8800ff, #ff2200)",
        backgroundSize: "300% 100%",
        animation: win
          ? "led-flash 0.3s step-start infinite"
          : "led-cycle 4s linear infinite",
      }}
    />
  );
}

// ── Segment display ───────────────────────────────────────────────────────────
function SegDisplay({
  label,
  value,
  color = "amber",
}: {
  label: string;
  value: string | number;
  color?: "amber" | "green";
}) {
  const colorStyle =
    color === "green"
      ? { color: "#34d399", animation: "win-seg-glow 1.2s ease-in-out infinite" }
      : { color: "#fbbf24", animation: "seg-glow 2s ease-in-out infinite" };

  return (
    <div className="flex flex-col items-center">
      <div
        className="text-[8px] font-black uppercase tracking-[0.2em] mb-0.5"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {label}
      </div>
      <div
        className="font-black tabular-nums leading-none"
        style={{
          fontSize: "clamp(16px, 3vw, 22px)",
          fontFamily: "'Courier New', monospace",
          ...colorStyle,
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function DemoSlot() {
  const t             = useTranslations("landing.demo");
  const { track }     = useConversionTracker();
  const [grid,        setGrid]       = useState<SlotSymbol[][]>(INITIAL_GRID);
  const [spinning,    setSpinning]   = useState(false);
  const [balance,     setBalance]    = useState(1000);
  const [lastWin,     setLastWin]    = useState(0);
  const [spinCount,   setSpinCount]  = useState(0);
  const [showOverlay, setShowOverlay] = useState(false);
  const [totalWon,    setTotalWon]   = useState(0);
  const [winningRow,  setWinningRow] = useState(false);
  const [showWinFlash, setShowWinFlash] = useState(false);
  const [jackpot,     setJackpot]    = useState(847293 + Math.floor(Math.random() * 50000));
  const spinTimeouts  = useRef<NodeJS.Timeout[]>([]);
  const spinAudioRef  = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timeouts = spinTimeouts.current;
    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Jackpot ticker
  useEffect(() => {
    const id = setInterval(
      () => setJackpot((p) => p + Math.floor(Math.random() * 120) + 40),
      3000 + Math.random() * 3000,
    );
    return () => clearInterval(id);
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

    try {
      const spinAudio = new Audio("/sounds/slot-spin.mp3");
      spinAudio.loop  = true;
      spinAudio.play().catch(() => {});
      spinAudioRef.current = spinAudio;
    } catch { /* ignore */ }

    let ticks = 0;
    const animInterval = setInterval(() => {
      setGrid(generateGrid());
      ticks++;
      if (ticks >= 14) {
        clearInterval(animInterval);
        const finalGrid = generateGrid();
        if ((spinCount + 1) % 3 === 0) {
          const winSymbol = SYMBOLS[Math.floor(Math.random() * 5)];
          finalGrid[0][1] = { ...winSymbol };
          finalGrid[1][1] = { ...winSymbol };
          finalGrid[2][1] = { ...winSymbol };
        }
        setGrid(finalGrid);
        const win = checkWin(finalGrid);

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
            const jackpotAudio   = new Audio("/sounds/jackpot.mp3");
            jackpotAudio.volume  = 0.55;
            jackpotAudio.play().catch(() => {});
          } catch { /* ignore */ }

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
        filter: winningRow
          ? "drop-shadow(0 0 50px rgba(251,191,36,0.4))"
          : "drop-shadow(0 0 30px rgba(124,58,237,0.3))",
        transition: "filter 0.5s ease",
      }}
    >
      <style>{ARCADE_CSS}</style>

      {/* ── Outer cabinet body ─────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(175deg, #1a0a38 0%, #0c0220 50%, #0a0118 100%)",
          boxShadow: [
            "0 0 0 1px rgba(0,0,0,0.9)",
            "0 0 0 3px rgba(100,70,200,0.6)",
            "0 0 0 4px rgba(180,150,255,0.25)",
            "0 0 0 6px rgba(80,40,160,0.4)",
            "0 0 0 7px rgba(40,10,80,0.7)",
            "0 20px 80px rgba(0,0,0,0.9)",
            "0 0 60px rgba(124,58,237,0.2)",
            "inset 0 2px 0 rgba(255,255,255,0.07)",
            "inset 0 -2px 0 rgba(0,0,0,0.5)",
          ].join(", "),
        }}
      >

        {/* Corner bolts */}
        {([
          { cls: "top-3 left-3" },
          { cls: "top-3 right-3" },
          { cls: "bottom-3 left-3" },
          { cls: "bottom-3 right-3" },
        ] as const).map(({ cls }, i) => (
          <div
            key={i}
            className={`absolute ${cls} z-20 pointer-events-none`}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #e0c060, #b8860b 60%, #6b4800)",
              boxShadow: "0 0 4px rgba(251,191,36,0.5), inset 0 1px 2px rgba(255,255,255,0.3)",
            }}
          />
        ))}

        {/* ── Marquee ────────────────────────────────────────────────────── */}
        <Marquee jackpot={jackpot} totalWon={totalWon} />

        {/* ── Cabinet header ─────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{
            background: "linear-gradient(90deg, rgba(80,30,180,0.35) 0%, rgba(20,5,50,0.6) 50%, rgba(80,30,180,0.35) 100%)",
            borderBottom: "1px solid rgba(124,58,237,0.4)",
          }}
        >
          {/* LED dots */}
          <div className="flex items-center gap-1.5">
            {(["#fbbf24", "#ec4899", "#7c3aed", "#10b981"] as const).map((c, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: c,
                  boxShadow: `0 0 6px ${c}cc, 0 0 2px ${c}`,
                  animation: `led-flash ${1.1 + i * 0.25}s ease-in-out infinite alternate`,
                }}
              />
            ))}
          </div>

          {/* Brand */}
          <span
            className="text-[11px] font-black tracking-[0.3em] uppercase"
            style={{
              background: "linear-gradient(90deg, #a78bfa 0%, #fbbf24 50%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Midnight Riches
          </span>

          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[8px] font-bold text-amber-400 uppercase tracking-wider">
            {t("demoMode")}
          </span>
        </div>

        {/* ── Top LED strip ──────────────────────────────────────────────── */}
        <LedStrip win={winningRow} />

        {/* ── Reel window + lever ────────────────────────────────────────── */}
        <div className="flex items-center gap-0 px-3 py-3">

          {/* Reel area */}
          <div className="relative flex-1 overflow-hidden rounded-xl" style={{ padding: 3 }}>
            {/* LED border layer */}
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                backgroundImage: winningRow
                  ? "linear-gradient(90deg, #ffd700, #ffec00, #ffd700, #ffec00)"
                  : "linear-gradient(90deg, #ff2200, #ff7700, #ffdd00, #00ff88, #00aaff, #8800ff, #ff2200)",
                backgroundSize: "300% 100%",
                animation: winningRow ? "led-flash 0.3s step-start infinite" : "led-cycle 4s linear infinite",
                zIndex: 0,
              }}
            />

            {/* Inner reel container */}
            <div
              className="relative overflow-hidden rounded-lg"
              style={{
                background: "linear-gradient(180deg, #b8cfe0 0%, #6e93ba 12%, #325d8a 30%, #142e50 50%, #325d8a 70%, #6e93ba 88%, #b8cfe0 100%)",
              }}
            >
              {/* Glass screen reflection */}
              <div
                className="absolute inset-0 pointer-events-none z-40 rounded-lg"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)",
                }}
              />

              {/* Edge shadows */}
              <div className="absolute top-0 bottom-0 left-0 w-10 pointer-events-none z-20"
                style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.65) 0%, transparent 100%)" }} />
              <div className="absolute top-0 bottom-0 right-0 w-10 pointer-events-none z-20"
                style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.65) 0%, transparent 100%)" }} />
              <div className="absolute inset-x-0 top-0 h-6 pointer-events-none z-20"
                style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />
              <div className="absolute inset-x-0 bottom-0 h-6 pointer-events-none z-20"
                style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }} />

              {/* Symbol grid */}
              <div className="relative z-10 grid grid-cols-3 gap-1.5 p-2.5">
                {grid.map((reel, col) =>
                  reel.map((symbol, row) => {
                    const isPayline  = row === 1;
                    const isWinCell  = isPayline && winningRow;
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
                          height: 102,
                          borderRadius: 8,
                          background: isWinCell
                            ? "linear-gradient(180deg, rgba(255,210,0,0.32) 0%, rgba(255,160,0,0.18) 55%, rgba(160,100,0,0.10) 100%)"
                            : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(0,12,40,0.32) 55%, rgba(0,0,18,0.52) 100%)",
                          border: isWinCell
                            ? "1.5px solid rgba(255,210,0,0.95)"
                            : isPayline
                            ? "1px solid rgba(251,191,36,0.55)"
                            : "1px solid rgba(251,191,36,0.18)",
                          boxShadow: isWinCell
                            ? "0 0 20px rgba(255,210,0,0.6), 0 0 8px rgba(255,210,0,0.4), inset 0 0 16px rgba(255,200,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)"
                            : isPayline
                            ? "inset 0 0 12px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.42)"
                            : "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.42)",
                        }}
                      >
                        {/* Top highlight */}
                        <div className="absolute inset-x-0 top-0 pointer-events-none"
                          style={{ height: "32%", borderRadius: "8px 8px 0 0", background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)" }} />
                        {/* Bottom shadow */}
                        <div className="absolute inset-x-0 bottom-0 pointer-events-none"
                          style={{ height: "26%", borderRadius: "0 0 8px 8px", background: "linear-gradient(0deg, rgba(0,0,20,0.40) 0%, transparent 100%)" }} />

                        {isWinCell && (
                          <div className="absolute inset-0 animate-pulse pointer-events-none rounded-lg"
                            style={{ background: "rgba(255,210,0,0.10)" }} />
                        )}

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={symbol.src}
                          alt={symbol.label}
                          width={82}
                          height={82}
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

              {/* Column dividers */}
              {[1, 2].map((i) => (
                <div key={i} className="absolute top-2 bottom-2 w-px pointer-events-none z-30"
                  style={{
                    left: `calc(${(i / 3) * 100}%)`,
                    background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.5) 80%, transparent 100%)",
                  }}
                />
              ))}

              {/* Payline */}
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
                <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `5px solid ${winningRow ? "rgba(255,210,0,0.95)" : "rgba(251,191,36,0.5)"}` }} />
              </div>
              <div className="absolute right-1 pointer-events-none z-30" style={{ top: "50%", transform: "translateY(-50%)" }}>
                <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `5px solid ${winningRow ? "rgba(255,210,0,0.95)" : "rgba(251,191,36,0.5)"}` }} />
              </div>

              {/* Win flash */}
              <AnimatePresence>
                {showWinFlash && (
                  <motion.div
                    key="win-flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0.6, 1, 0] }}
                    transition={{ duration: 0.6, times: [0, 0.15, 0.35, 0.55, 1] }}
                    className="pointer-events-none absolute inset-0 z-40 rounded-lg"
                    style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(255,215,0,0.28) 0%, rgba(255,165,0,0.08) 70%, transparent 100%)" }}
                  />
                )}
              </AnimatePresence>

              {/* Win text */}
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
            </div>
          </div>

          {/* Lever */}
          <div className="flex flex-col items-center justify-center ml-2 mr-1">
            <SlotLever onPull={spin} disabled={spinning} />
          </div>
        </div>

        {/* Coin trajectories */}
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

        {/* ── Bottom LED strip ────────────────────────────────────────────── */}
        <LedStrip win={winningRow} />

        {/* ── Control panel ──────────────────────────────────────────────── */}
        <div
          className="px-4 pt-3 pb-4"
          style={{
            background: "linear-gradient(180deg, rgba(10,2,30,0.8) 0%, rgba(6,1,18,0.95) 100%)",
            borderTop: "1px solid rgba(80,40,180,0.35)",
          }}
        >
          {/* Score displays */}
          <div className="flex items-stretch justify-between gap-2 mb-3">
            {/* Balance display */}
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-lg py-2"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(251,191,36,0.25)",
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.5), inset 0 0 12px rgba(0,0,0,0.3)",
              }}
            >
              <SegDisplay label={t("balance")} value={balance} color="amber" />
            </div>

            {/* Bet display */}
            <div
              className="flex flex-col items-center justify-center rounded-lg px-3 py-2"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(124,58,237,0.25)",
                boxShadow: "inset 0 1px 0 rgba(0,0,0,0.5)",
                minWidth: 60,
              }}
            >
              <div className="text-[7px] font-black uppercase tracking-[0.2em] text-white/35 mb-0.5">BET</div>
              <div
                className="text-base font-black tabular-nums"
                style={{
                  color: "#a78bfa",
                  fontFamily: "'Courier New', monospace",
                  textShadow: "0 0 8px rgba(167,139,250,0.8)",
                }}
              >
                10
              </div>
            </div>

            {/* Win display */}
            <div
              className="flex-1 flex flex-col items-center justify-center rounded-lg py-2"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${lastWin > 0 ? "rgba(52,211,153,0.4)" : "rgba(52,211,153,0.15)"}`,
                boxShadow: lastWin > 0 ? "inset 0 0 12px rgba(52,211,153,0.1)" : "inset 0 1px 0 rgba(0,0,0,0.5)",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              <AnimatePresence mode="popLayout">
                {lastWin > 0 ? (
                  <motion.div
                    key="has-win"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center"
                  >
                    <SegDisplay label={t("win")} value={`+${lastWin}`} color="green" />
                  </motion.div>
                ) : (
                  <motion.div key="no-win" className="flex flex-col items-center">
                    <div className="text-[7px] font-black uppercase tracking-[0.2em] text-white/25 mb-0.5">{t("win")}</div>
                    <div className="text-base font-black tabular-nums text-white/20" style={{ fontFamily: "'Courier New', monospace" }}>---</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SPIN button — big, round, physical */}
          <div className="flex items-center justify-center gap-4">
            {/* Max bet button */}
            <button
              onClick={() => {}}
              className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 border"
              style={{
                background: "linear-gradient(180deg, rgba(80,40,160,0.4), rgba(40,10,80,0.6))",
                borderColor: "rgba(124,58,237,0.4)",
                color: "rgba(167,139,250,0.8)",
                boxShadow: "0 3px 0 rgba(40,10,80,0.8), 0 1px 0 rgba(255,255,255,0.05) inset",
              }}
            >
              <span className="text-[10px]">⚡</span>
              MAX
            </button>

            {/* Main SPIN button */}
            <button
              onClick={spin}
              disabled={spinning}
              className="relative flex items-center justify-center rounded-full font-black text-sm transition-all duration-100 active:scale-95 disabled:cursor-not-allowed select-none"
              style={{
                width: 80,
                height: 80,
                background: spinning
                  ? "radial-gradient(circle at 40% 35%, #9a6500, #7a4800)"
                  : "radial-gradient(circle at 40% 35%, #fde68a 0%, #f59e0b 45%, #b45309 100%)",
                boxShadow: spinning
                  ? "0 2px 8px rgba(0,0,0,0.6), 0 2px 0 rgba(80,40,0,0.8), inset 0 2px 4px rgba(0,0,0,0.4)"
                  : "0 6px 0 rgba(90,50,0,0.9), 0 8px 20px rgba(251,191,36,0.5), 0 1px 0 rgba(255,255,255,0.0) inset, inset 0 2px 4px rgba(255,255,255,0.35)",
                transform: spinning ? "translateY(3px)" : "translateY(0)",
                color: spinning ? "#d4a017" : "#1a0a00",
                border: "2px solid rgba(255,255,255,0.12)",
              }}
            >
              {/* Button face shine */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.25) 0%, transparent 60%)" }}
              />
              <span className="relative z-10 flex flex-col items-center leading-none gap-0.5">
                {spinning ? (
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" />
                  </svg>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-[9px] font-black tracking-widest">
                      {spinning ? t("spinning") : t("spin")}
                    </span>
                  </>
                )}
              </span>
            </button>

            {/* Info button */}
            <button
              onClick={() => {}}
              className="flex flex-col items-center justify-center rounded-xl px-3 py-2 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 border"
              style={{
                background: "linear-gradient(180deg, rgba(20,80,40,0.4), rgba(5,40,15,0.6))",
                borderColor: "rgba(16,185,129,0.4)",
                color: "rgba(52,211,153,0.8)",
                boxShadow: "0 3px 0 rgba(5,40,15,0.8), 0 1px 0 rgba(255,255,255,0.05) inset",
              }}
            >
              <span className="text-[10px]">ℹ️</span>
              HELP
            </button>
          </div>
        </div>

        {/* ── Signup overlay ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl p-6 text-center"
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
