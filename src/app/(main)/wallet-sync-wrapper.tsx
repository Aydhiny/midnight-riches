"use client";

import { useWalletSync } from "@/hooks/use-wallet-sync";

export function WalletSyncWrapper() {
  useWalletSync();
  return null;
}
