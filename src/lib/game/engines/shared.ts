import type { GameSymbol, SymbolGrid } from "@/types";
import { secureRandomInt } from "../rng";

export interface SymbolWeight {
  symbol: GameSymbol;
  weight: number;
}

export interface PayoutEntry {
  symbol: GameSymbol;
  count: number;
  multiplier: number;
}

export function buildReelStrip(weights: SymbolWeight[], stops: number): GameSymbol[] {
  const strip: GameSymbol[] = [];
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  for (let i = 0; i < stops; i++) {
    let roll = secureRandomInt(totalWeight);
    for (const { symbol, weight } of weights) {
      roll -= weight;
      if (roll < 0) {
        strip.push(symbol);
        break;
      }
    }
  }
  return strip;
}

export function pickFromStrip(strip: GameSymbol[]): GameSymbol {
  return strip[secureRandomInt(strip.length)];
}

export function generateGrid(
  reelStrips: GameSymbol[][],
  reelCount: number,
  rowCount: number
): SymbolGrid {
  const grid: SymbolGrid = [];
  for (let col = 0; col < reelCount; col++) {
    const reel: GameSymbol[] = [];
    const strip = reelStrips[col % reelStrips.length];
    for (let row = 0; row < rowCount; row++) {
      reel.push(strip[secureRandomInt(strip.length)]);
    }
    grid.push(reel);
  }
  return grid;
}

export function countSymbolInGrid(grid: SymbolGrid, symbol: GameSymbol): number {
  let count = 0;
  for (const reel of grid) {
    for (const s of reel) {
      if (s === symbol) count++;
    }
  }
  return count;
}

export function gridHasWild(grid: SymbolGrid): boolean {
  for (const reel of grid) {
    for (const s of reel) {
      if (s === "wild") return true;
    }
  }
  return false;
}

export const DENOMINATIONS = [0.10, 0.20, 0.50, 1, 2, 5, 10, 20, 50, 100];
