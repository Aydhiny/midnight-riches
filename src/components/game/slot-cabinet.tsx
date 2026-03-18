"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { useSound } from "@/hooks/use-sound";
import { spinAction } from "@/server/actions/spin";
import { generateReels } from "@/lib/game/engine";
import { formatCurrency } from "@/lib/utils";
import { ReelSpinAnimation } from "./reel-spin-animation";
import { BetControls } from "./bet-controls";
import { WinDisplay } from "./win-display";
import { BonusDisplay } from "./bonus-display";

export function SlotCabinet() {
  const t = useTranslations("game");
  const { play } = useSound();
  const {
    betPerLine,
    totalBet,
    spinState,
    lastResult,
    bonus,
    autoSpin,
    setSpinState,
    setLastResult,
    setBonus,
    setAutoSpin,
  } = useGameStore();
  const { balance, setBalance, optimisticDeduct } = useWalletStore();
  const [showWin, setShowWin] = useState(false);
  const [displayReels, setDisplayReels] = useState(generateReels());
  const isSpinning = spinState !== "idle";

  const handleSpin = useCallback(async () => {
    if (isSpinning) return;
    if (!bonus.isActive && balance < totalBet) return;

    setSpinState("pending");
    setShowWin(false);
    play("spin");

    if (!bonus.isActive) {
      optimisticDeduct(totalBet);
    }

    const response = await spinAction({ betPerLine, bonus });

    if (!response.success) {
      setSpinState("idle");
      return;
    }

    setSpinState("animating");
    setDisplayReels(response.result.reels);
    setLastResult(response.result);
    setBonus(response.bonus);
    setBalance(response.balance);

    setTimeout(() => {
      setSpinState("idle");
      play("reelStop");

      if (response.result.totalWin > 0) {
        setShowWin(true);
        play(response.result.totalWin >= 50 ? "bigWin" : "win");
        setTimeout(() => setShowWin(false), 3000);
      }

      if (response.result.bonusTriggered) {
        play("bonusTrigger");
      }
    }, 1500);
  }, [
    isSpinning,
    bonus,
    balance,
    totalBet,
    betPerLine,
    setSpinState,
    setLastResult,
    setBonus,
    setBalance,
    optimisticDeduct,
    play,
  ]);

  return (
    <div className="flex flex-col items-center gap-6">
      <BonusDisplay bonus={bonus} />

      <AnimatedGradientBorder className="p-1">
        <div className="relative rounded-xl bg-gradient-to-b from-purple-950/80 to-black p-6">
          <div className="mb-4 text-center">
            <span className="text-xs uppercase tracking-wider text-purple-400">
              {t("balance")}
            </span>
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(balance)}
            </div>
          </div>

          <div className="relative">
            <ReelSpinAnimation reels={displayReels} isSpinning={isSpinning} />
            <WinDisplay
              winAmount={lastResult?.totalWin ?? 0}
              isVisible={showWin}
            />
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <BetControls />

            <div className="flex items-center gap-3">
              <ShimmerButton
                onClick={handleSpin}
                disabled={isSpinning || (!bonus.isActive && balance < totalBet)}
                className="min-w-[160px]"
              >
                {isSpinning ? "..." : bonus.isActive ? t("freeSpins") : t("spin")}
              </ShimmerButton>

              <Button
                variant={autoSpin ? "destructive" : "outline"}
                onClick={() => setAutoSpin(autoSpin ? null : { totalSpins: 10, remainingSpins: 10, stopOnWin: false, stopOnBonus: true, stopOnBalanceBelow: totalBet, stopOnWinAbove: totalBet * 50 })}
                disabled={isSpinning}
              >
                {autoSpin ? t("stop") : t("autoPlay")}
              </Button>
            </div>
          </div>
        </div>
      </AnimatedGradientBorder>
    </div>
  );
}
