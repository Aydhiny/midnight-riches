"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Gamepad2, Wallet, History, Settings, LogOut,
  ChevronDown, Menu, X, ShoppingBag, BarChart3,
} from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWalletStore } from "@/store/wallet-store";
import { formatTokens } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/game",    key: "game",         icon: Gamepad2    },
  { href: "/wallet",  key: "wallet",       icon: Wallet      },
  { href: "/history", key: "history",      icon: History     },
  { href: "/shop",    key: "collectibles", icon: ShoppingBag },
] as const;

export function Navbar() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const { balance } = useWalletStore();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--nav-border)] bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href={session?.user ? "/game" : "/"} className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/images/midnight-riches-logo.png"
            alt="Midnight Riches"
            width={32}
            height={32}
            className="object-contain drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]"
          />
          <span className="hidden sm:block text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
            Midnight{" "}
            <span style={{ fontFamily: "var(--font-garamond)", fontWeight: 400, fontStyle: "italic" }}>
              Riches
            </span>
          </span>
        </Link>

        {session?.user && (
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={[
                  "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  isActive(href)
                    ? "text-[var(--text-primary)] bg-[var(--glass-bg)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {t(key)}
                {isActive(href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-violet-500"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {session?.user ? (
            <>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                <Image src="/images/coin-token.png" alt="tokens" width={14} height={14} className="object-contain shrink-0" />
                <span className="text-sm font-bold text-amber-400 tabular-nums">
                  {formatTokens(balance)}
                </span>
              </div>

              <NotificationBell />

              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-2 py-1.5 transition-all hover:bg-[var(--bg-card-hover)]"
                >
                  <div className="relative h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shrink-0">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src="/images/profile-pic.webp"
                        alt="Profile"
                        width={28}
                        height={28}
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-[var(--nav-bg)]" />
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-[var(--text-secondary)] max-w-[80px] truncate">
                    {session.user.name?.split(" ")[0] ?? "Player"}
                  </span>
                  <ChevronDown
                    className={`hidden sm:block h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${
                      avatarOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[var(--glass-border)] shadow-xl"
                      style={{
                        background: "var(--dropdown-bg)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "var(--dropdown-shadow)",
                      }}
                    >
                      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {session.user.name ?? "Player"}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate">{session.user.email}</p>
                        <div className="mt-2 flex items-center gap-1.5 sm:hidden">
                          <Image src="/images/coin-token.png" alt="tokens" width={13} height={13} className="object-contain" />
                          <span className="text-sm font-bold text-amber-400">
                            {formatTokens(balance)}
                          </span>
                        </div>
                      </div>

                      <div className="py-1.5">
                        <DropdownLink href="/settings" icon={Settings} label={t("settings")} onClick={() => setAvatarOpen(false)} />
                        <DropdownLink href="/wallet" icon={Wallet} label={t("wallet")} onClick={() => setAvatarOpen(false)} />
                        <DropdownLink href="/history" icon={History} label={t("betHistory")} onClick={() => setAvatarOpen(false)} />
                        <DropdownLink href="/stats" icon={BarChart3} label="My Stats" onClick={() => setAvatarOpen(false)} />
                      </div>

                      <div className="border-t border-[var(--glass-border)] py-1.5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <LocaleSwitcher dropUp />
                          <ThemeToggle />
                        </div>
                        <button
                          onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t("signOut")}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <ThemeToggle />
              <Link
                href="/auth/signin"
                className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all"
              >
                {t("signIn")}
              </Link>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && session?.user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-[var(--glass-border)]"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                    isActive(href)
                      ? "bg-violet-500/15 text-[var(--text-primary)] border border-violet-500/25"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(key)}
                </Link>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 mt-2">
                <Image src="/images/coin-token.png" alt="tokens" width={16} height={16} className="object-contain" />
                <span className="text-sm font-bold text-amber-400">{formatTokens(balance)}</span>
              </div>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                {t("signOut")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors"
    >
      <Icon className="h-4 w-4 text-[var(--text-muted)]" />
      {label}
    </Link>
  );
}
