"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { SparkleText } from "@/components/ui/sparkle-text";
import { formatCurrency } from "@/lib/utils";

interface WinDisplayProps {
  winAmount: number;
  isVisible: boolean;
}

export function WinDisplay({ winAmount, isVisible }: WinDisplayProps) {
  const t = useTranslations("game");

  const isBigWin = winAmount >= 50;
  const isMegaWin = winAmount >= 200;

  return (
    <AnimatePresence>
      {isVisible && winAmount > 0 && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <div className="rounded-2xl bg-black/80 px-8 py-4 backdrop-blur-sm">
            <SparkleText
              className="text-center"
              sparkleColor={isMegaWin ? "#F5C842" : "#10B981"}
            >
              <div className="text-sm uppercase tracking-wider text-purple-300">
                {isMegaWin ? t("megaWin") : isBigWin ? t("bigWin") : t("win")}
              </div>
              <div
                className={`text-4xl font-black ${
                  isMegaWin
                    ? "text-yellow-400"
                    : isBigWin
                    ? "text-emerald-400"
                    : "text-white"
                }`}
              >
                {formatCurrency(winAmount)}
              </div>
            </SparkleText>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
