"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface WinModalProps {
  amount: number;
  betAmount: number;
  isVisible: boolean;
  onClose: () => void;
}

export function WinModal({ amount, betAmount, isVisible, onClose }: WinModalProps) {
  const [displayAmount, setDisplayAmount] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setDisplayAmount(0);
      return;
    }

    let current = 0;
    const target = amount;
    const step = target / 30;
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setDisplayAmount(current);
    }, 50);

    return () => clearInterval(interval);
  }, [isVisible, amount]);

  if (!isVisible) return null;

  const ratio = betAmount > 0 ? amount / betAmount : 0;
  const tier = ratio >= 100 ? "MEGA WIN" : ratio >= 50 ? "SUPER WIN" : "BIG WIN";
  const tierColor =
    ratio >= 100
      ? "text-yellow-300"
      : ratio >= 50
        ? "text-emerald-300"
        : "text-purple-300";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 relative rounded-2xl border border-yellow-500/50 bg-gradient-to-b from-purple-900 to-black p-8 text-center shadow-2xl shadow-yellow-500/20">
        <div className={`text-4xl font-black ${tierColor}`}>{tier}!</div>
        <div className="mt-4 text-5xl font-black text-yellow-400">
          {formatCurrency(displayAmount)}
        </div>
        <div className="mt-2 text-sm text-purple-400">{ratio.toFixed(0)}x your bet</div>
        <button
          onClick={onClose}
          className="mt-6 rounded-lg bg-yellow-600 px-6 py-2 font-bold text-black transition-colors hover:bg-yellow-500"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
