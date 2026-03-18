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
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
