"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "next-intl";
import { setUserLocale, type Locale } from "@/i18n/locale";
import { cn } from "@/lib/utils";

const LOCALES: { code: Locale; flag: string; label: string; fullName: string }[] = [
  { code: "en", flag: "🇬🇧", label: "EN", fullName: "English" },
  { code: "bs", flag: "🇧🇦", label: "BS", fullName: "Bosanski" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(locale as Locale);
  const [isPending, startTransition] = useTransition();

  const currentLocale = LOCALES.find((l) => l.code === current) ?? LOCALES[0];

  function switchLocale(locale: Locale) {
    setCurrent(locale);
    startTransition(async () => {
      await setUserLocale(locale);
      setOpen(false);
      window.location.reload();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg px-3 text-sm",
          "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
          "backdrop-blur-md transition-all duration-200",
          isPending && "opacity-50 pointer-events-none"
        )}
        aria-label="Switch language"
      >
        <span className="text-base leading-none">{currentLocale.flag}</span>
        <span className="hidden sm:block text-xs font-semibold tracking-wide">{currentLocale.label}</span>
        <svg
          width="9"
          height="9"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn("transition-transform duration-200 opacity-60", open && "rotate-180")}
        >
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute right-0 top-full mt-2 z-50 overflow-hidden rounded-xl",
                "backdrop-blur-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]",
                "shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
                "min-w-[148px]"
              )}
            >
              {LOCALES.map((locale, i) => (
                <button
                  key={locale.code}
                  onClick={() => switchLocale(locale.code)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-sm",
                    "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                    "hover:bg-[var(--bg-card-hover)] transition-colors duration-150",
                    i > 0 && "border-t border-[var(--glass-border)]",
                    locale.code === current && "text-[var(--text-primary)] bg-[var(--glass-bg)]"
                  )}
                >
                  <span className="text-xl leading-none">{locale.flag}</span>
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-xs tracking-wide leading-none">{locale.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">{locale.fullName}</span>
                  </div>
                  {locale.code === current && (
                    <span className="ml-auto text-amber-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
