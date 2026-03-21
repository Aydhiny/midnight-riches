"use client";

import { useTranslations } from "next-intl";
import type { BonusState } from "@/types";

interface BonusModalProps {
  bonus: BonusState;
  isVisible: boolean;
  onStart: () => void;
}

export function BonusModal({ bonus, isVisible, onStart }: BonusModalProps) {
  const t = useTranslations("game.bonusModal");

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="animate-in zoom-in-95 relative rounded-2xl border border-pink-500/50 bg-gradient-to-b from-purple-900 to-black p-8 text-center shadow-2xl shadow-pink-500/20">
        <div className="text-5xl">🎰</div>
        <div className="mt-4 text-3xl font-black text-pink-400">{t("title")}</div>
        <div className="mt-4 space-y-2">
          <div className="text-lg text-white">
            <span className="text-pink-300">{bonus.spinsRemaining}</span> {t("freeSpins")}
          </div>
          <div className="text-lg text-white">
            <span className="text-yellow-400">{bonus.multiplier}x</span> {t("multiplier")}
          </div>
        </div>
        <button
          onClick={onStart}
          className="mt-6 rounded-lg bg-pink-600 px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-pink-500"
        >
          {t("start")}
        </button>
      </div>
    </div>
  );
}
