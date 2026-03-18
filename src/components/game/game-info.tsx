"use client";

import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency } from "@/lib/utils";

export function GameInfo() {
  const { bonus, lastResult } = useGameStore();
  const { balance } = useWalletStore();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-4 py-2">
      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Balance</span>
        <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(balance)}</div>
      </div>

      <div className="text-center">
        <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Last Win</span>
        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
          {lastResult?.totalWin ? formatCurrency(lastResult.totalWin) : "$0.00"}
        </div>
      </div>

      {bonus.isActive && (
        <>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Free Spins</span>
            <div className="text-lg font-bold text-pink-600 dark:text-pink-400">{bonus.spinsRemaining}</div>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Multiplier</span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{bonus.multiplier}x</div>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wider text-[var(--text-muted)]">Bonus Win</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(bonus.totalBonusWin)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
