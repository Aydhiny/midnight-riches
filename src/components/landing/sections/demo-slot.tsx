"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cherry, Citrus, Circle, Grape, Apple, Star, Gem, Crown, Sparkles, type LucideIcon } from "lucide-react";
import { GlassCard } from "../ui/glass";
import ShinyButton from "@/components/ui/shiny-button";
import { useConversionTracker } from "@/lib/analytics/conversion";
import { cn } from "@/lib/utils";

interface SlotSymbol {
  id: string;
  icon: LucideIcon;
  color: string;
}

const SYMBOLS: SlotSymbol[] = [
  { id: "cherry", icon: Cherry, color: "text-red-400" },
  { id: "citrus", icon: Citrus, color: "text-yellow-400" },
  { id: "circle", icon: Circle, color: "text-orange-400" },
  { id: "grape", icon: Grape, color: "text-purple-400" },
  { id: "apple", icon: Apple, color: "text-green-400" },
  { id: "star", icon: Star, color: "text-amber-400" },
  { id: "gem", icon: Gem, color: "text-cyan-400" },
  { id: "crown", icon: Crown, color: "text-yellow-300" },
];

const PAYOUTS: Record<string, number> = {
  "cherry": 5,
  "citrus": 8,
  "circle": 10,
  "grape": 15,
  "apple": 20,
  "star": 50,
  "gem": 75,
  "crown": 100,
};

function randomSymbol(): SlotSymbol {
  return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function generateGrid(): SlotSymbol[][] {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => randomSymbol())
  );
}

function checkWin(grid: SlotSymbol[][]): number {
  const a = grid[0][1].id;
  const b = grid[1][1].id;
  const c = grid[2][1].id;
  if (a === b && b === c) return PAYOUTS[a] || 0;
  return 0;
}

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
  const spinTimeouts = useRef<NodeJS.Timeout[]>([]);

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
    setBalance((b) => b - bet);
    setLastWin(0);
    track("demo_spin", { spinNumber: spinCount + 1 });

    let ticks = 0;
    const animInterval = setInterval(() => {
      setGrid(generateGrid());
      ticks++;
      if (ticks >= 12) {
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
        if (win > 0) {
          setLastWin(win);
          setBalance((b) => b + win);
          setTotalWon((w) => w + win);
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
    }, 80);
    spinTimeouts.current.push(animInterval as unknown as NodeJS.Timeout);
  }, [spinning, balance, spinCount, track]);

  return (
    <GlassCard className="relative w-full max-w-sm p-5">
      {/* Inner glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 0 40px rgba(255,215,0,0.06), 0 0 60px rgba(139,92,246,0.15)" }} />

      {/* Demo badge */}
      <div className="absolute right-4 top-4 z-20">
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-sm">
          {t("demoMode")}
        </span>
      </div>

      {/* Slot grid */}
      <div className="rounded-xl overflow-hidden p-2"
        style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-3 gap-1.5">
          {grid.map((reel, col) =>
            reel.map((symbol, row) => {
              const Icon = symbol.icon;
              return (
                <motion.div
                  key={`${col}-${row}`}
                  animate={spinning ? { scale: [1, 0.92, 1] } : { scale: 1 }}
                  transition={spinning ? { repeat: Infinity, duration: 0.15 } : {}}
                  className={cn(
                    "flex h-16 items-center justify-center rounded-lg select-none",
                    "backdrop-blur-sm",
                    row === 1
                      ? "bg-white/[0.08] ring-1 ring-amber-400/30 shadow-[0_0_12px_rgba(255,215,0,0.12)]"
                      : "bg-white/[0.04]"
                  )}
                >
                  <Icon className={cn("h-7 w-7", symbol.color)} />
                </motion.div>
              );
            })
          )}
        </div>
        <div className="mt-1.5 text-center text-[10px] text-white/30 tracking-wider">
          ← {t("payline")} →
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t("balance")}</div>
          <div className="font-black tabular-nums text-amber-400 text-xl leading-none">
            {balance.toLocaleString()}
          </div>
        </div>

        <AnimatePresence>
          {lastWin > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400">{t("win")}</div>
              <div className="font-black text-emerald-400 text-lg leading-none">+{lastWin}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={spin}
          disabled={spinning}
          className={cn(
            "rounded-xl px-5 py-2.5 font-black text-sm transition-all",
            "bg-gradient-to-r from-amber-400 to-amber-500 text-black",
            "hover:from-amber-300 hover:to-amber-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)]",
            "active:scale-95"
          )}
        >
          {spinning ? "◌" : t("spin")}
        </button>
      </div>

      {/* Conversion Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl backdrop-blur-xl p-6 text-center"
            style={{ background: "rgba(6,1,15,0.88)" }}
          >
            <Sparkles className="h-10 w-10 text-amber-400" />
            <h3 className="mt-3 text-xl font-black text-amber-400">
              {t("overlayTitle")}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {t("overlayDescription", { credits: totalWon })}
            </p>
            <Link
              href="/auth/signup"
              onClick={() => track("cta_click", { section: "demo_overlay", button: "signup" })}
              className="mt-4"
            >
              <ShinyButton className="h-12 px-6 text-sm">
                {t("overlayCta")}
              </ShinyButton>
            </Link>
            <button
              onClick={() => setShowOverlay(false)}
              className="mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              {t("overlayDismiss")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
