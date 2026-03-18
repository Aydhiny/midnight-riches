"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useConversionTracker } from "@/lib/analytics/conversion";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "../ui/theme-toggle";
import Magnet from "@/components/ui/magnet";
import ClickSpark from "@/components/ui/click-spark";
import ShinyButton from "@/components/ui/shiny-button";
import Image from "next/image";
import { useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "#games", labelKey: "games" },
  { href: "#bonuses", labelKey: "bonuses" },
  { href: "#how-it-works", labelKey: "howItWorks" },
  { href: "#faq", labelKey: "faq" },
] as const;

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { track } = useConversionTracker();
  const { data: session } = useSession();

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleCtaClick() {
    track("cta_click", { section: "nav", button: "claim_bonus" });
  }

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-500",
          scrolled
            ? "backdrop-blur-2xl bg-[var(--nav-bg)] border-b border-[var(--nav-border)] shadow-[0_1px_8px_rgba(0,0,0,0.12)]"
            : "backdrop-blur-md bg-[var(--nav-bg)] border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-full from-white to-pink-500">
              <Image src="/logo.svg" alt="Midnight Riches Logo" width={28} height={28} priority />
              <div className="absolute inset-0 rounded-[7px] bg-gradient-to-br from-black/80 to-pink-500/30 blur-sm group-hover:blur-lg transition-all" />
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Midnight{" "}
              <span style={{ fontFamily: "var(--font-garamond)", fontWeight: 400, fontStyle: "italic" }}>
                Riches
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Magnet key={link.href} padding={40} magnetStrength={4}>
                <a
                  href={link.href}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg",
                    "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    "hover:bg-[var(--glass-bg)] transition-all duration-200",
                  )}
                >
                  {t(link.labelKey)}
                </a>
              </Magnet>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />

            {session?.user ? (
              <>
                {/* Play Now button */}
                <Link href="/game" className="hidden md:block">
                  <ShinyButton className="h-9 px-4 text-sm flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Play Now
                  </ShinyButton>
                </Link>
                {/* Profile avatar */}
                <Link href="/settings" className="hidden md:flex">
                  <div className="relative h-9 w-9 rounded-full border-2 border-[var(--glass-border)] overflow-hidden bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center hover:border-violet-400 transition-colors">
                    {session.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={session.user.image} alt={session.user.name ?? "User"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                      </span>
                    )}
                    {/* Online indicator */}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[var(--nav-bg)]" />
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className={cn(
                    "hidden md:block px-3 py-1.5 text-sm font-medium rounded-lg",
                    "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    "border border-[var(--glass-border)] hover:bg-[var(--glass-bg)]",
                    "transition-all duration-200",
                  )}
                >
                  {t("signIn")}
                </Link>

                <ClickSpark sparkColor="#FFD700" sparkCount={12}>
                  <Link href="/auth/signup" onClick={handleCtaClick}>
                    <ShinyButton className="h-9 px-4 text-sm hidden md:flex items-center">{t("claimBonus")}</ShinyButton>
                  </Link>
                </ClickSpark>
              </>
            )}

            {/* Hamburger */}
            <button
              className={cn(
                "md:hidden w-9 h-9 rounded-lg flex items-center justify-center",
                "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
                "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                "transition-all duration-200",
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? <path d="M3 3l12 12M15 3L3 15" /> : <path d="M2 4h14M2 9h14M2 14h14" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-[var(--nav-border)] backdrop-blur-2xl bg-[var(--nav-bg)]"
            >
              <div className="flex flex-col gap-1 p-4">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium",
                      "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                      "hover:bg-[var(--glass-bg)] transition-all duration-200",
                    )}
                  >
                    {t(link.labelKey)}
                  </a>
                ))}

                {session?.user ? (
                  <>
                    <Link
                      href="/game"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium",
                        "text-white bg-gradient-to-r from-violet-600 to-pink-600",
                        "hover:from-violet-500 hover:to-pink-500 transition-all duration-200",
                        "flex items-center gap-2",
                      )}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="inline mr-1"><path d="M8 5v14l11-7z"/></svg>
                    Play Now
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium",
                        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        "hover:bg-[var(--glass-bg)] transition-all duration-200",
                        "flex items-center gap-3",
                      )}
                    >
                      <div className="relative h-7 w-7 rounded-full border border-[var(--glass-border)] overflow-hidden bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shrink-0">
                        {session.user.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={session.user.image} alt={session.user.name ?? "User"} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                          </span>
                        )}
                        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-[var(--nav-bg)]" />
                      </div>
                      <span>{session.user.name ?? session.user.email ?? "Profile"}</span>
                    </Link>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[var(--glass-border)]">
                      <ThemeToggle />
                      <LanguageSwitcher />
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-sm font-medium",
                        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                        "hover:bg-[var(--glass-bg)] transition-all duration-200",
                      )}
                    >
                      {t("signIn")}
                    </Link>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--glass-border)]">
                      <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                      </div>
                      <Link
                        href="/auth/signup"
                        onClick={() => {
                          setMobileOpen(false);
                          handleCtaClick();
                        }}
                      >
                        <ShinyButton className="h-9 px-4 text-sm">{t("claimBonus")}</ShinyButton>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
