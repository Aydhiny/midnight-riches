"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Gamepad2, Calendar, Trophy, Zap, ChevronDown } from "lucide-react";
import { GlassPill, GoldGradientText } from "../ui/glass";
import ShinyButton from "@/components/ui/shiny-button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";

function getTimeToMidnightUTC() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCDate(midnight.getUTCDate() + 1);
  midnight.setUTCHours(0, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/5 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 14, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="text-3xl font-black tabular-nums text-amber-400"
            style={{ textShadow: "0 0 20px rgba(251,191,36,0.5)" }}
            suppressHydrationWarning
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

const BONUS_ROWS = [
  { icon: Gift,     key: "firstDeposit", color: "bg-amber-400/10",   iconColor: "text-amber-400"   },
  { icon: Gamepad2, key: "welcomeGift",  color: "bg-violet-400/10",  iconColor: "text-violet-400"  },
  { icon: Calendar, key: "dailyLogin",   color: "bg-emerald-400/10", iconColor: "text-emerald-400" },
  { icon: Trophy,   key: "firstWin",     color: "bg-pink-400/10",    iconColor: "text-pink-400"    },
] as const;

export function BonusOfferSection() {
  const t = useTranslations("landing.bonus");
  const { track } = useConversionTracker();
  const [time, setTime] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setTime(getTimeToMidnightUTC());
    const interval = setInterval(() => setTime(getTimeToMidnightUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="bonuses" className="relative py-24 md:py-32 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,0.07) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20 items-center">

            <div className="flex flex-col">
              <GlassPill className="w-fit gap-2 text-amber-500 dark:text-amber-400 border-amber-400/30 bg-amber-400/10 mb-6">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-bold tracking-widest uppercase">{t("headline")}</span>
              </GlassPill>

              <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-[var(--text-primary)]">
                {t("claimYour")}<br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("welcomePackage")}
                </span>
              </h2>

              <p className="mt-4 text-[var(--text-muted)] text-sm leading-relaxed">
                {t("offerExpires")}
              </p>

              <div className="mt-8 flex items-center gap-3">
                <CountdownDigit value={time.hours} label={t("hours")} />
                <span className="text-3xl font-black text-amber-400/60 pb-5">:</span>
                <CountdownDigit value={time.minutes} label={t("minutes")} />
                <span className="text-3xl font-black text-amber-400/60 pb-5">:</span>
                <CountdownDigit value={time.seconds} label={t("seconds")} />
              </div>

              <div className="mt-10">
                <Link
                  href="/auth/signup"
                  onClick={() => track("cta_click", { section: "bonus", button: "claim" })}
                >
                  <ShinyButton className="h-13 px-8 text-base font-bold">{t("cta")}</ShinyButton>
                </Link>
              </div>

              <p className="mt-5 text-[10px] text-[var(--text-muted)]/60 flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-[8px] font-black text-red-400 shrink-0">
                  18+
                </span>
                {t("finePrint")}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1">
                {t("whatsIncluded")}
              </p>

              {BONUS_ROWS.map((row) => (
                <div
                  key={row.key}
                  className="group flex items-center gap-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-5 py-4 hover:border-amber-400/30 hover:bg-[var(--bg-card-hover)] transition-all duration-200 backdrop-blur-sm"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${row.color}`}>
                    <row.icon className={`h-5 w-5 ${row.iconColor}`} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text-secondary)]">
                    {t(`${row.key}.label`)}
                  </span>
                  <GoldGradientText as="span" className="text-sm font-bold tabular-nums text-right shrink-0">
                    {t(`${row.key}.value`)}
                  </GoldGradientText>
                  <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                    →
                  </span>
                </div>
              ))}

              <div className="mt-2">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                  />
                  {t("howBonusesWork")}
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-3 text-xs leading-relaxed text-[var(--text-muted)] overflow-hidden"
                    >
                      {t("howBonusesWorkText")}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
