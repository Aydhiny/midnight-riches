"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/game-store";
import { MIN_BET, MAX_BET } from "@/lib/game/symbols";
import { formatCurrency } from "@/lib/utils";

const BET_STEPS = [0.1, 0.25, 0.5, 1, 2, 5, 10, 25, 50, 100];

export function BetControls() {
  const t = useTranslations("game");
  const { betPerLine, totalBet, spinState, setBetPerLine, gameType } = useGameStore();
  const isSpinning = spinState !== "idle";

  function adjustBet(direction: "up" | "down") {
    const currentIndex = BET_STEPS.indexOf(betPerLine);
    if (direction === "up" && currentIndex < BET_STEPS.length - 1) {
      setBetPerLine(BET_STEPS[currentIndex + 1]);
    } else if (direction === "down" && currentIndex > 0) {
      setBetPerLine(BET_STEPS[currentIndex - 1]);
    }
  }

  const paylines = gameType === "classic" ? 5 : gameType === "megaways" ? 1 : 20;

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-wider text-purple-400">{t("betPerLine")}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustBet("down")}
            disabled={isSpinning || betPerLine <= MIN_BET}
          >
            -
          </Button>
          <span className="min-w-[80px] text-center text-lg font-bold text-yellow-400">
            {formatCurrency(betPerLine)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustBet("up")}
            disabled={isSpinning || betPerLine >= MAX_BET}
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-wider text-purple-400">{t("lines")}</span>
        <span className="text-lg font-bold text-white">{paylines}</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-xs uppercase tracking-wider text-purple-400">{t("totalBet")}</span>
        <span className="text-lg font-bold text-yellow-400">{formatCurrency(totalBet)}</span>
      </div>
    </div>
  );
}
