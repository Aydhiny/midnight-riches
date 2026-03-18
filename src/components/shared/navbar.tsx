"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2, Wallet, History, Settings, Bell, LogOut,
  ChevronDown, Zap, Menu, X, User, ShoppingBag,
} from "lucide-react";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { useWalletStore } from "@/store/wallet-store";
import { formatCurrency } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/game",     label: "Game",         icon: Gamepad2    },
  { href: "/wallet",   label: "Wallet",       icon: Wallet      },
  { href: "/history",  label: "History",      icon: History     },
  { href: "/shop",     label: "Collectibles", icon: ShoppingBag },
] as const;

export function Navbar() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { data: session } = useSession();
  const { balance, currency } = useWalletStore();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  // Close avatar dropdown on outside click
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
    <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[var(--nav-bg)] backdrop-blur-xl">
      {/* Subtle top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* ── Left: Logo ──────────────────────────────────── */}
        <Link href={session?.user ? "/game" : "/"} className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
          <span className="hidden sm:block text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
            Midnight{" "}
            <span style={{ fontFamily: "var(--font-garamond)", fontWeight: 400, fontStyle: "italic" }}>
              Riches
            </span>
          </span>
        </Link>

        {/* ── Center: Nav links (desktop) ─────────────────── */}
        {session?.user && (
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={[
                  "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  isActive(href)
                    ? "text-white bg-white/[0.08]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]",
                ].join(" ")}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {label}
                {/* Active underline */}
                {isActive(href) && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-violet-400"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
              </Link>
            ))}
          </div>
        )}

        {/* ── Right: Actions ──────────────────────────────── */}
        <div className="flex items-center gap-1.5">
          {session?.user ? (
            <>
              {/* Balance pill */}
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                <span className="text-sm font-bold text-amber-400 tabular-nums">
                  {formatCurrency(balance, currency)}
                </span>
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Avatar + dropdown */}
              <div ref={avatarRef} className="relative">
                <button
                  onClick={() => setAvatarOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-1.5 transition-all hover:bg-white/[0.09] hover:border-white/20"
                >
                  {/* Avatar circle */}
                  <div className="relative h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shrink-0">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={session.user.image}
                        alt={session.user.name ?? "User"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-white">
                        {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-[var(--nav-bg)]" />
                  </div>
                  <span className="hidden sm:block text-xs font-medium text-white/70 max-w-[80px] truncate">
                    {session.user.name?.split(" ")[0] ?? "Player"}
                  </span>
                  <ChevronDown
                    className={`hidden sm:block h-3 w-3 text-white/40 transition-transform duration-200 ${
                      avatarOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                <AnimatePresence>
                  {avatarOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 shadow-xl overflow-hidden"
                      style={{
                        background: "rgba(8,2,22,0.97)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-semibold text-white truncate">
                          {session.user.name ?? "Player"}
                        </p>
                        <p className="text-xs text-white/40 truncate">{session.user.email}</p>
                        {/* Balance in dropdown for mobile */}
                        <div className="mt-2 flex items-center gap-1.5 sm:hidden">
                          <Zap className="h-3 w-3 text-amber-400" />
                          <span className="text-sm font-bold text-amber-400">
                            {formatCurrency(balance, currency)}
                          </span>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        <DropdownLink
                          href="/settings"
                          icon={Settings}
                          label="Settings"
                          onClick={() => setAvatarOpen(false)}
                        />
                        <DropdownLink
                          href="/wallet"
                          icon={Wallet}
                          label="Wallet"
                          onClick={() => setAvatarOpen(false)}
                        />
                        <DropdownLink
                          href="/history"
                          icon={History}
                          label="Bet History"
                          onClick={() => setAvatarOpen(false)}
                        />
                      </div>

                      <div className="border-t border-white/[0.06] py-1.5">
                        <div className="flex items-center gap-2 px-3 py-1.5">
                          <LocaleSwitcher />
                          <ThemeToggle />
                        </div>
                        <button
                          onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: "/" }); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 hover:text-white transition-colors"
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
                className="rounded-lg border border-white/15 bg-white/[0.05] px-4 py-1.5 text-sm font-medium text-white/70 hover:bg-white/[0.09] hover:text-white transition-all"
              >
                {t("signIn")}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {mobileOpen && session?.user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/[0.06]"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={[
                    "flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                    isActive(href)
                      ? "bg-violet-600/20 text-white border border-violet-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/[0.05]",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
              {/* Balance in mobile menu */}
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 mt-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">{formatCurrency(balance, currency)}</span>
              </div>
              <button
                onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
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
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors"
    >
      <Icon className="h-4 w-4 text-white/40" />
      {label}
    </Link>
  );
}
