"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency } from "@/lib/utils";

export function Navbar() {
  const t = useTranslations("common");
  const { data: session } = useSession();
  const { balance, currency } = useWalletStore();

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            Midnight{" "}
            <span style={{ fontFamily: "var(--font-garamond)", fontWeight: 400, fontStyle: "italic" }}>
              Riches
            </span>
          </span>
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
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </Button>
              </Link>
              <NotificationBell />
              <div className="mx-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-600 dark:text-amber-400">
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
