import { create } from "zustand";
import type { Currency } from "@/types";

interface WalletStore {
  balance: number;
  pendingBet: number;
  currency: Currency;
  isLoading: boolean;
  setBalance: (balance: number) => void;
  setCurrency: (currency: Currency) => void;
  setLoading: (loading: boolean) => void;
  optimisticDeduct: (amount: number) => void;
  syncFromServer: (serverBalance: number) => void;
  credit: (amount: number) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  balance: 0,
  pendingBet: 0,
  currency: "USD",
  isLoading: true,
  setBalance: (balance) => set({ balance }),
  setCurrency: (currency) => set({ currency }),
  setLoading: (loading) => set({ isLoading: loading }),
  optimisticDeduct: (amount) =>
    set((s) => ({
      balance: Math.max(0, s.balance - amount),
      pendingBet: amount,
    })),
  syncFromServer: (serverBalance) => {
    const current = get().balance;
    const diff = Math.abs(current - serverBalance);
    if (diff > 0.01) {
      set({ balance: serverBalance, pendingBet: 0 });
    } else {
      set({ pendingBet: 0 });
    }
  },
  credit: (amount) => set((s) => ({ balance: s.balance + amount })),
}));
