"use client";

import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency } from "@/lib/utils";

export function GameInfo() {
  const { bonus, lastResult } = useGameStore();
  const { balance } = useWalletStore();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-purple-800 bg-purple-950/50 px-4 py-2">
      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-purple-400">Balance</span>
        <div className="text-lg font-bold text-yellow-400">{formatCurrency(balance)}</div>
      </div>

      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-purple-400">Last Win</span>
        <div className="text-lg font-bold text-emerald-400">
          {lastResult?.totalWin ? formatCurrency(lastResult.totalWin) : "$0.00"}
        </div>
      </div>

      {bonus.isActive && (
        <>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-purple-400">Free Spins</span>
            <div className="text-lg font-bold text-pink-400">{bonus.spinsRemaining}</div>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-purple-400">Multiplier</span>
            <div className="text-lg font-bold text-yellow-400">{bonus.multiplier}x</div>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-purple-400">Bonus Win</span>
            <div className="text-lg font-bold text-emerald-400">
              {formatCurrency(bonus.totalBonusWin)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
