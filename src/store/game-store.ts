import { create } from "zustand";
import type { SpinResult, BonusState, GameType, SpinState, AutoSpinConfig, WinEvaluation } from "@/types";

interface GameStore {
  gameType: GameType;
  betPerLine: number;
  totalBet: number;
  spinState: SpinState;
  lastResult: SpinResult | null;
  lastWin: WinEvaluation | null;
  bonus: BonusState;
  autoSpin: AutoSpinConfig | null;
  turboMode: boolean;
  activeBonusRoundId: string | null;
  setGameType: (type: GameType) => void;
  setBetPerLine: (bet: number) => void;
  setSpinState: (state: SpinState) => void;
  setLastResult: (result: SpinResult | null) => void;
  setLastWin: (win: WinEvaluation | null) => void;
  setBonus: (bonus: BonusState) => void;
  setAutoSpin: (config: AutoSpinConfig | null) => void;
  setTurboMode: (turbo: boolean) => void;
  setActiveBonusRoundId: (id: string | null) => void;
  reset: () => void;
}

function getPaylines(gameType: GameType): number {
  switch (gameType) {
    case "classic": return 5;
    case "five-reel": return 20;
    case "cascade": return 20;
    case "megaways": return 1;
  }
}

const defaultBonus: BonusState = {
  isActive: false,
  spinsRemaining: 0,
  multiplier: 1,
  totalBonusWin: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameType: "classic",
  betPerLine: 0.10,
  totalBet: 0.10 * 5,
  spinState: "idle",
  lastResult: null,
  lastWin: null,
  bonus: defaultBonus,
  autoSpin: null,
  turboMode: false,
  activeBonusRoundId: null,
  setGameType: (type) => {
    const paylines = getPaylines(type);
    const bet = get().betPerLine;
    set({ gameType: type, totalBet: type === "megaways" ? bet : bet * paylines });
  },
  setBetPerLine: (bet) => {
    const paylines = getPaylines(get().gameType);
    const type = get().gameType;
    set({ betPerLine: bet, totalBet: type === "megaways" ? bet : bet * paylines });
  },
  setSpinState: (spinState) => set({ spinState }),
  setLastResult: (result) => set({ lastResult: result }),
  setLastWin: (win) => set({ lastWin: win }),
  setBonus: (bonus) => set({ bonus }),
  setAutoSpin: (config) => set({ autoSpin: config }),
  setTurboMode: (turbo) => set({ turboMode: turbo }),
  setActiveBonusRoundId: (id) => set({ activeBonusRoundId: id }),
  reset: () =>
    set({
      betPerLine: 0.10,
      totalBet: 0.50,
      spinState: "idle",
      lastResult: null,
      lastWin: null,
      bonus: defaultBonus,
      autoSpin: null,
      turboMode: false,
      activeBonusRoundId: null,
    }),
}));
