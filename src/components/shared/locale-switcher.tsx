"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale } from "next-intl";
import { Check, ChevronDown, Globe } from "lucide-react";
import { setUserLocale, type Locale } from "@/i18n/locale";
import { motion, AnimatePresence } from "framer-motion";

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "bs", label: "Bosanski", flag: "🇧🇦" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  function handleSelect(newLocale: Locale) {
    setOpen(false);
    startTransition(async () => {
      await setUserLocale(newLocale);
    });
  }

  const current = LOCALES.find((l) => l.value === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
          open
            ? "border-violet-500/40 bg-white/[0.09] text-white"
            : "border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.09] hover:text-white/90 hover:border-white/20",
          isPending ? "opacity-50 cursor-wait" : "",
        ].join(" ")}
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span className="leading-none">{current.flag} {current.value.toUpperCase()}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ── Dropdown combobox list ─────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            role="listbox"
            aria-label="Select language"
            className="absolute right-0 top-full mt-1.5 min-w-[148px] overflow-hidden rounded-xl border border-white/10 shadow-2xl z-[200]"
            style={{
              background: "rgba(8, 2, 22, 0.97)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              boxShadow: [
                "0 8px 32px rgba(0,0,0,0.65)",
                "0 0 0 1px rgba(255,255,255,0.06)",
                "0 0 24px rgba(124,58,237,0.12)",
              ].join(", "),
            }}
          >
            {/* Header */}
            <div className="px-3 py-1.5 border-b border-white/[0.06]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                Language
              </p>
            </div>

            {/* Options */}
            <div className="py-1">
              {LOCALES.map((l) => {
                const isSelected = locale === l.value;
                return (
                  <button
                    key={l.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(l.value)}
                    className={[
                      "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                      isSelected
                        ? "bg-violet-600/15 text-white"
                        : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                    ].join(" ")}
                  >
                    <span className="text-base leading-none">{l.flag}</span>
                    <span className="flex-1 text-left text-xs font-medium">{l.label}</span>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
