"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { GameSymbol } from "@/types";
import { SymbolIcon } from "./symbol-icon";

interface ReelProps {
  symbols: GameSymbol[];
  isSpinning: boolean;
  reelIndex: number;
}

const CELL_HEIGHT = 108;
const SYMBOL_SIZE = 94;
const CELL_GAP = 4;

function ReelCell({ symbol, isSpinning }: { symbol: GameSymbol; isSpinning: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden shrink-0"
      style={{
        height: CELL_HEIGHT,
        borderRadius: 10,
        margin: `${CELL_GAP / 2}px 4px`,
        background: isSpinning
          ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,8,30,0.45) 55%, rgba(0,0,18,0.6) 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.11) 0%, rgba(0,12,40,0.28) 55%, rgba(0,0,18,0.45) 100%)",
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.42), inset 0 0 14px rgba(0,0,0,0.22)",
        transition: "background 0.15s ease",
      }}
    >
      {/* Top highlight */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none"
        style={{
          height: "32%",
          borderRadius: "10px 10px 0 0",
          background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)",
        }}
      />
      {/* Bottom shadow */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none"
        style={{
          height: "26%",
          borderRadius: "0 0 10px 10px",
          background: "linear-gradient(0deg, rgba(0,0,20,0.40) 0%, transparent 100%)",
        }}
      />

      {/* Symbol with lighting filter */}
      <div
        className="relative z-10"
        style={{
          filter: isSpinning
            ? "blur(2px) brightness(0.75)"
            : "drop-shadow(0 3px 12px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(124,58,237,0.4)) brightness(1.08)",
          transition: "filter 0.15s ease",
        }}
      >
        <SymbolIcon symbol={symbol} size={SYMBOL_SIZE} />
      </div>
    </div>
  );
}

export function Reel({ symbols, isSpinning, reelIndex }: ReelProps) {
  const containerHeight = symbols.length * (CELL_HEIGHT + CELL_GAP) + 12;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 128,
        height: containerHeight,
        borderRadius: 14,
        background: "linear-gradient(180deg, #c4d6e8 0%, #7a9fc5 15%, #3c6490 35%, #1a3a5e 50%, #3c6490 65%, #7a9fc5 85%, #c4d6e8 100%)",
        boxShadow: [
          "0 0 0 1px rgba(0,0,0,0.75)",
          "0 0 0 3px rgba(138,172,206,0.85)",
          "0 0 0 4px rgba(221,232,245,0.45)",
          "0 0 0 6px rgba(124,58,237,0.65)",
          "0 0 0 7px rgba(167,139,250,0.38)",
          "inset 0 2px 4px rgba(255,255,255,0.14)",
          "inset 0 -2px 4px rgba(0,0,0,0.32)",
          "0 8px 24px rgba(0,0,0,0.6)",
        ].join(", "),
      }}
    >
      {/* Left edge shadow */}
      <div
        className="absolute top-0 bottom-0 left-0 w-2.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      />
      {/* Right edge shadow */}
      <div
        className="absolute top-0 bottom-0 right-0 w-2.5 pointer-events-none z-20"
        style={{ background: "linear-gradient(270deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      />
      {/* Top edge shadow */}
      <div
        className="absolute inset-x-0 top-0 h-4 pointer-events-none z-20"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      />
      {/* Bottom edge shadow */}
      <div
        className="absolute inset-x-0 bottom-0 h-4 pointer-events-none z-20"
        style={{ background: "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, transparent 100%)" }}
      />

      {/* Divider lines between rows */}
      {symbols.slice(0, -1).map((_, i) => (
        <div
          key={i}
          className="absolute inset-x-2 h-px pointer-events-none z-30"
          style={{
            top: `calc(${((i + 1) / symbols.length) * 100}% )`,
            background: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.38) 20%, rgba(255,255,255,0.06) 50%, rgba(0,0,0,0.38) 80%, transparent 100%)",
          }}
        />
      ))}

      <AnimatePresence mode="wait">
        {isSpinning ? (
          <motion.div
            key="spinning"
            className="flex flex-col items-center py-1"
            animate={{
              y: [0, -(CELL_HEIGHT + CELL_GAP) * symbols.length, 0],
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "linear",
              delay: reelIndex * 0.1,
            }}
          >
            {[...symbols, ...symbols].map((symbol, index) => (
              <ReelCell key={`spin-${index}`} symbol={symbol} isSpinning={true} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="stopped"
            className="flex flex-col items-center py-1"
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
              <ReelCell key={`stop-${index}`} symbol={symbol} isSpinning={false} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
