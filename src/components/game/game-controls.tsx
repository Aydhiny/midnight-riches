"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { DENOMINATIONS } from "@/lib/game/engines/shared";
import type { AutoSpinConfig } from "@/types";

interface GameControlsProps {
  onSpin: () => void;
  disabled: boolean;
}

const AUTO_SPIN_OPTIONS = [10, 25, 50, 100];

export function GameControls({ onSpin, disabled }: GameControlsProps) {
  const {
    betPerLine,
    totalBet,
    bonus,
    spinState,
    autoSpin,
    turboMode,
    gameType,
    setBetPerLine,
    setAutoSpin,
    setTurboMode,
  } = useGameStore();
  const { balance } = useWalletStore();

  const currentIndex = DENOMINATIONS.indexOf(betPerLine);

  const decrementBet = useCallback(() => {
    if (currentIndex > 0) {
      setBetPerLine(DENOMINATIONS[currentIndex - 1]);
    }
  }, [currentIndex, setBetPerLine]);

  const incrementBet = useCallback(() => {
    if (currentIndex < DENOMINATIONS.length - 1) {
      setBetPerLine(DENOMINATIONS[currentIndex + 1]);
    }
  }, [currentIndex, setBetPerLine]);

  const setMaxBet = useCallback(() => {
    setBetPerLine(DENOMINATIONS[DENOMINATIONS.length - 1]);
  }, [setBetPerLine]);

  const startAutoSpin = useCallback((count: number) => {
    const config: AutoSpinConfig = {
      totalSpins: count,
      remainingSpins: count,
      stopOnWin: false,
      stopOnBonus: true,
      stopOnBalanceBelow: totalBet,
      stopOnWinAbove: totalBet * 50,
    };
    setAutoSpin(config);
  }, [totalBet, setAutoSpin]);

  const stopAutoSpin = useCallback(() => {
    setAutoSpin(null);
  }, [setAutoSpin]);

  const isSpinning = spinState !== "idle";
  const canSpin = !disabled && !isSpinning && (bonus.isActive || balance >= totalBet);

  const showLines = gameType === "classic" || gameType === "five-reel";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={decrementBet}
            disabled={isSpinning || currentIndex <= 0}
            className="h-6 w-6 p-0 text-[var(--text-secondary)]"
          >
            −
          </Button>
          <div className="min-w-[80px] text-center">
            <span className="text-xs text-[var(--text-muted)]">BET/LINE</span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
              ${betPerLine.toFixed(2)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={incrementBet}
            disabled={isSpinning || currentIndex >= DENOMINATIONS.length - 1}
            className="h-6 w-6 p-0 text-[var(--text-secondary)]"
          >
            +
          </Button>
        </div>

        <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 py-1.5 text-center">
          <span className="text-xs text-[var(--text-muted)]">TOTAL BET</span>
          <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
            ${totalBet.toFixed(2)}
          </div>
        </div>

        {showLines && (
          <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 py-1.5 text-center">
            <span className="text-xs text-[var(--text-muted)]">LINES</span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {gameType === "classic" ? 5 : 20}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={setMaxBet}
          disabled={isSpinning}
          className="border-[var(--glass-border)] text-[var(--text-secondary)]"
        >
          MAX
        </Button>

        <ShimmerButton
          onClick={onSpin}
          disabled={!canSpin}
          className="min-w-[140px]"
        >
          {isSpinning
            ? "..."
            : bonus.isActive
              ? `FREE SPIN (${bonus.spinsRemaining})`
              : "SPIN"}
        </ShimmerButton>

        <Button
          variant={turboMode ? "default" : "outline"}
          size="sm"
          onClick={() => setTurboMode(!turboMode)}
          disabled={isSpinning}
          className={turboMode ? "bg-amber-600 text-white" : "border-[var(--glass-border)] text-[var(--text-secondary)]"}
        >
          ⚡
        </Button>
      </div>

      <div className="flex items-center gap-1">
        {autoSpin ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={stopAutoSpin}
          >
            STOP ({autoSpin.remainingSpins})
          </Button>
        ) : (
          AUTO_SPIN_OPTIONS.map((count) => (
            <Button
              key={count}
              variant="outline"
              size="sm"
              onClick={() => startAutoSpin(count)}
              disabled={isSpinning}
              className="border-[var(--glass-border)] text-xs text-[var(--text-secondary)]"
            >
              {count}x
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
