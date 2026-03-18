import type { GameSymbol } from "@/types";

export interface SymbolConfig {
  id: GameSymbol;
  name: string;
  color: string;
  weight: number;
  payouts: Record<number, number>;
}

export const SYMBOLS: Record<GameSymbol, SymbolConfig> = {
  cherry: {
    id: "cherry",
    name: "Cherry",
    color: "#DC2626",
    weight: 25,
    payouts: { 2: 5, 3: 25 },
  },
  lemon: {
    id: "lemon",
    name: "Lemon",
    color: "#FACC15",
    weight: 22,
    payouts: { 2: 5, 3: 30 },
  },
  orange: {
    id: "orange",
    name: "Orange",
    color: "#F97316",
    weight: 20,
    payouts: { 2: 8, 3: 40 },
  },
  grape: {
    id: "grape",
    name: "Grape",
    color: "#8B5CF6",
    weight: 18,
    payouts: { 2: 10, 3: 50 },
  },
  watermelon: {
    id: "watermelon",
    name: "Watermelon",
    color: "#10B981",
    weight: 15,
    payouts: { 2: 15, 3: 75 },
  },
  wild: {
    id: "wild",
    name: "Wild",
    color: "#F5C842",
    weight: 5,
    payouts: { 2: 20, 3: 100 },
  },
  scatter: {
    id: "scatter",
    name: "Scatter",
    color: "#EC4899",
    weight: 5,
    payouts: { 2: 2, 3: 5 },
  },
  seven: {
    id: "seven",
    name: "Seven",
    color: "#EF4444",
    weight: 3,
    payouts: { 3: 100 },
  },
  bar: {
    id: "bar",
    name: "Bar",
    color: "#94A3B8",
    weight: 3,
    payouts: { 3: 50 },
  },
};

export const REEL_SYMBOLS: GameSymbol[] = Object.entries(SYMBOLS).flatMap(
  ([id, config]) => Array(config.weight).fill(id as GameSymbol)
);

export const PAYLINES: [number, number][][] = [
  [[0, 1], [1, 1], [2, 1]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 2], [1, 2], [2, 2]],
  [[0, 0], [1, 1], [2, 2]],
  [[0, 2], [1, 1], [2, 0]],
];

export const BONUS_FREE_SPINS = 10;
export const BONUS_MULTIPLIER = 2;
export const MIN_BET = 0.1;
export const MAX_BET = 100;
export const NUM_REELS = 3;
export const NUM_ROWS = 3;
export const NUM_PAYLINES = 5;
