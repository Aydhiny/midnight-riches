"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameSymbol } from "@/types";
import { SymbolIcon } from "./symbol-icon";

interface ReelProps {
  symbols: GameSymbol[];
  isSpinning: boolean;
  reelIndex: number;
}

export function Reel({ symbols, isSpinning, reelIndex }: ReelProps) {
  return (
    <div className="relative h-[240px] w-[90px] overflow-hidden rounded-lg border border-purple-500/30 bg-black/80">
      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div
            key="spinning"
            className="flex flex-col items-center justify-center gap-1"
            animate={{
              y: [0, -480, 0],
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "linear",
              delay: reelIndex * 0.1,
            }}
          >
            {symbols.map((symbol, index) => (
              <div key={`spin-${index}`} className="flex h-[76px] items-center justify-center">
                <SymbolIcon symbol={symbol} size={64} />
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="stopped"
            className="flex flex-col items-center justify-center gap-1"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: 0.3,
              delay: reelIndex * 0.15,
              type: "spring",
              stiffness: 300,
            }}
          >
            {symbols.map((symbol, index) => (
              <div key={`stop-${index}`} className="flex h-[76px] items-center justify-center">
                <SymbolIcon symbol={symbol} size={64} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
