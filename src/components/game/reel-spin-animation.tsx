"use client";

import { motion } from "framer-motion";
import type { ReelResult } from "@/types";
import { Reel } from "./reel";

interface ReelSpinAnimationProps {
  reels: ReelResult;
  isSpinning: boolean;
}

export function ReelSpinAnimation({ reels, isSpinning }: ReelSpinAnimationProps) {
  return (
    <motion.div
      className="flex items-center gap-2"
      layout
    >
      {reels.map((symbols, index) => (
        <Reel
          key={index}
          symbols={symbols}
          isSpinning={isSpinning}
          reelIndex={index}
        />
      ))}
    </motion.div>
  );
}
