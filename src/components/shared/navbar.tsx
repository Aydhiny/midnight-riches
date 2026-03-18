"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { SparkleText } from "@/components/ui/sparkle-text";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("common");
  const { data: session } = useSession();
  const { balance, currency } = useWalletStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-purple-500/20 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <SparkleText className="text-xl font-black text-yellow-400">{t("appName")}</SparkleText>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link href="/game">
                <Button variant="ghost" size="sm">
                  {t("game")}
                </Button>
              </Link>
              <Link href="/wallet">
                <Button variant="ghost" size="sm">
                  {t("wallet")}
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm">
                  {t("history")}
                </Button>
              </Link>
              <div className="mx-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-sm font-bold text-yellow-400">
                {formatCurrency(balance, currency)}
              </div>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                {t("signOut")}
              </Button>
            </>
          ) : (
            <Link href="/auth/signin">
              <Button variant="gold" size="sm">
                {t("signIn")}
              </Button>
            </Link>
          )}
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
