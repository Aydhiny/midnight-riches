"use client";

import { useEffect } from "react";
import { useWalletStore } from "@/store/wallet-store";
import { getWalletAction } from "@/server/actions/wallet";

export function useWalletSync() {
  const { setBalance, setCurrency, setLoading } = useWalletStore();

  useEffect(() => {
    async function sync() {
      setLoading(true);
      const result = await getWalletAction();
      if (result.success) {
        setBalance(result.balance);
        if (result.currency) {
          setCurrency(result.currency as "USD" | "EUR" | "BAM");
        }
      }
      setLoading(false);
    }
    sync();
  }, [setBalance, setCurrency, setLoading]);
}
