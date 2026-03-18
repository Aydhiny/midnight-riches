"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { BonusState } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface BonusDisplayProps {
  bonus: BonusState;
}

export function BonusDisplay({ bonus }: BonusDisplayProps) {
  const t = useTranslations("game");

  return (
    <AnimatePresence>
      {bonus.isActive && (
        <motion.div
          className="flex items-center gap-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-6 py-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="text-sm font-bold uppercase tracking-wider text-yellow-400">
            {t("bonusRound")}
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-purple-300">
              {t("spinsRemaining")}:{" "}
              <span className="font-bold text-white">{bonus.spinsRemaining}</span>
            </span>
            <span className="text-purple-300">
              {t("multiplier")}:{" "}
              <span className="font-bold text-yellow-400">{bonus.multiplier}x</span>
            </span>
            <span className="text-purple-300">
              {t("bonusWin")}:{" "}
              <span className="font-bold text-emerald-400">
                {formatCurrency(bonus.totalBonusWin)}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
