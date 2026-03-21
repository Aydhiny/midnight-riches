"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { DENOMINATIONS } from "@/lib/game/engines/shared";
import { motion } from "framer-motion";
import type { AutoSpinConfig } from "@/types";
import { Zap, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

const AUTO_SPIN_OPTIONS = [10, 25, 50, 100];

interface ControlPanelProps {
  onSpin: () => void;
  disabled: boolean;
}

/** 3D embossed button */
function CabinetButton({
  onClick,
  disabled,
  children,
  variant = "default",
  className = "",
}: {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: "default" | "spin" | "active" | "danger";
  className?: string;
}) {
  const styles = {
    default: {
      bg: "rgba(20,8,45,0.9)",
      border: "rgba(124,58,237,0.3)",
      shadow: "rgba(0,0,0,0.5)",
      text: "rgba(255,255,255,0.7)",
    },
    spin: {
      bg: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
      border: "rgba(236,72,153,0.6)",
      shadow: "rgba(124,58,237,0.6)",
      text: "#ffffff",
    },
    active: {
      bg: "rgba(245,158,11,0.25)",
      border: "rgba(245,158,11,0.5)",
      shadow: "rgba(245,158,11,0.3)",
      text: "#f59e0b",
    },
    danger: {
      bg: "rgba(239,68,68,0.2)",
      border: "rgba(239,68,68,0.4)",
      shadow: "rgba(239,68,68,0.2)",
      text: "#f87171",
    },
  }[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.94, y: 2 } : undefined}
      className={`relative rounded-xl font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        boxShadow: `0 4px 0 ${styles.shadow}, 0 6px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
      }}
    >
      {children}
    </motion.button>
  );
}

export function ControlPanel({ onSpin, disabled }: ControlPanelProps) {
  const t = useTranslations("game.controlPanel");
  const {
    betPerLine, totalBet, bonus, spinState, autoSpin, turboMode, gameType,
    setBetPerLine, setAutoSpin, setTurboMode,
  } = useGameStore();
  const { balance } = useWalletStore();

  const currentIndex = DENOMINATIONS.indexOf(betPerLine);
  const isSpinning = spinState !== "idle";
  const canSpin = !disabled && !isSpinning && (bonus.isActive || balance >= totalBet);
  const showLines = gameType === "classic" || gameType === "five-reel";

  const decrementBet = useCallback(() => {
    if (currentIndex > 0) setBetPerLine(DENOMINATIONS[currentIndex - 1]);
  }, [currentIndex, setBetPerLine]);

  const incrementBet = useCallback(() => {
    if (currentIndex < DENOMINATIONS.length - 1) setBetPerLine(DENOMINATIONS[currentIndex + 1]);
  }, [currentIndex, setBetPerLine]);

  const setMaxBet = useCallback(() => {
    setBetPerLine(DENOMINATIONS[DENOMINATIONS.length - 1]);
  }, [setBetPerLine]);

  const startAutoSpin = useCallback((count: number) => {
    const config: AutoSpinConfig = {
      totalSpins: count, remainingSpins: count, stopOnWin: false,
      stopOnBonus: false, stopOnBalanceBelow: totalBet, stopOnWinAbove: totalBet * 50,
    };
    setAutoSpin(config);
  }, [totalBet, setAutoSpin]);

  return (
    <div
      className="w-full rounded-2xl border border-white/[0.07] p-4"
      style={{
        background: "linear-gradient(160deg, #1a0a2e 0%, #0d0620 100%)",
        boxShadow: "0 -2px 20px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      {/* Top row: Bet controls */}
      <div className="flex items-center justify-between gap-2">
        {/* Bet per line */}
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
          <CabinetButton onClick={decrementBet} disabled={isSpinning || currentIndex <= 0} className="h-7 w-7 text-sm flex items-center justify-center">
            <ChevronLeft className="h-3.5 w-3.5" />
          </CabinetButton>
          <div className="min-w-[72px] text-center px-1">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{t("betPerLine")}</div>
            <div className="text-sm font-black text-amber-400 tabular-nums">{betPerLine.toFixed(2)} cr</div>
          </div>
          <CabinetButton onClick={incrementBet} disabled={isSpinning || currentIndex >= DENOMINATIONS.length - 1} className="h-7 w-7 text-sm flex items-center justify-center">
            <ChevronRight className="h-3.5 w-3.5" />
          </CabinetButton>
        </div>

        {/* Total bet pill */}
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-center">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{t("totalBet")}</div>
          <div className="text-sm font-black text-amber-400 tabular-nums">{totalBet.toFixed(2)} cr</div>
        </div>

        {/* Lines (where applicable) */}
        {showLines && (
          <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-1.5 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/30">{t("lines")}</div>
            <div className="text-sm font-black text-violet-400">{gameType === "classic" ? 5 : 20}</div>
          </div>
        )}

        {/* Max bet */}
        <CabinetButton onClick={setMaxBet} disabled={isSpinning} className="px-3 py-2 text-xs">
          {t("maxBet")}
        </CabinetButton>
      </div>

      {/* Spin row */}
      <div className="mt-3 flex items-center gap-2">
        {/* Turbo toggle */}
        <CabinetButton
          onClick={() => setTurboMode(!turboMode)}
          disabled={isSpinning}
          variant={turboMode ? "active" : "default"}
          className="h-12 w-12 flex items-center justify-center shrink-0"
        >
          <Zap className="h-5 w-5" />
        </CabinetButton>

        {/* SPIN — main button */}
        <CabinetButton
          onClick={onSpin}
          disabled={!canSpin}
          variant="spin"
          className="flex-1 h-12 text-base tracking-widest"
        >
          <span className="relative z-10">
            {isSpinning
              ? <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t("spinning")}
                </span>
              : bonus.isActive
              ? t("freeSpin", { count: bonus.spinsRemaining })
              : t("spin")}
          </span>
        </CabinetButton>

        {/* Auto-stop button when active, else spacer */}
        {autoSpin ? (
          <CabinetButton
            onClick={() => setAutoSpin(null)}
            variant="danger"
            className="h-12 w-12 flex flex-col items-center justify-center shrink-0 gap-0"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-[9px] leading-none mt-0.5">{autoSpin.remainingSpins}</span>
          </CabinetButton>
        ) : (
          <div className="w-12 shrink-0" />
        )}
      </div>

      {/* Auto-spin row */}
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/25 mr-1 shrink-0">{t("autoSpin")}</span>
        {autoSpin ? (
          <div className="flex-1 rounded-lg bg-black/30 border border-red-500/20 px-3 py-1.5 text-center">
            <span className="text-xs font-bold text-red-400">
              {t("spinsRemaining", { count: autoSpin.remainingSpins })} —{" "}
              <button onClick={() => setAutoSpin(null)} className="ml-1.5 text-red-300 hover:text-red-200 underline underline-offset-2">{t("stop")}</button>
            </span>
          </div>
        ) : (
          AUTO_SPIN_OPTIONS.map((count) => (
            <CabinetButton
              key={count}
              onClick={() => startAutoSpin(count)}
              disabled={isSpinning}
              className="flex-1 py-1.5 text-xs"
            >
              {count}×
            </CabinetButton>
          ))
        )}
      </div>
    </div>
  );
}
