"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Gamepad2, Calendar, Trophy, Zap } from "lucide-react";
import { GlassCard, GlassPill, GoldGradientText } from "../ui/glass";
import SpotlightCard from "@/components/ui/spotlight-card";
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
    <div className="flex flex-col items-center gap-1">
      <GlassCard className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-2xl md:text-3xl font-black tabular-nums text-amber-400"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </GlassCard>
      <span className="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

const BONUS_ROWS = [
  { icon: Gift, key: "firstDeposit" },
  { icon: Gamepad2, key: "welcomeGift" },
  { icon: Calendar, key: "dailyLogin" },
  { icon: Trophy, key: "firstWin" },
] as const;

export function BonusOfferSection() {
  const t = useTranslations("landing.bonus");
  const { track } = useConversionTracker();
  const [time, setTime] = useState(getTimeToMidnightUTC);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeToMidnightUTC()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="bonuses" className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <SpotlightCard
            className="relative overflow-hidden rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-6 sm:p-8 md:p-12 lg:p-14"
            spotlightColor="rgba(139, 92, 246, 0.15)"
          >
            {/* Grain overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
                backgroundSize: "128px 128px",
                opacity: 0.12,
                mixBlendMode: "overlay",
              }}
            />
            {/* Purple radial bloom inside card */}
            <div
              className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-3/4 h-3/4 rounded-full"
              style={{
                background: "radial-gradient(ellipse, rgba(139,92,246,0.15) 0%, transparent 70%)",
              }}
            />
            {/* Headline */}
            <div className="text-center">
              <GlassPill className="mx-auto w-fit text-amber-500 dark:text-amber-400 border-amber-400/30 bg-amber-400/10">
                <Zap className="h-3.5 w-3.5" />
                <GoldGradientText className="text-xs font-bold">{t("headline")}</GoldGradientText>
              </GlassPill>
            </div>

            {/* Countdown */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <CountdownDigit value={time.hours} label={t("hours")} />
              <span className="text-2xl font-black text-amber-400 pb-5">:</span>
              <CountdownDigit value={time.minutes} label={t("minutes")} />
              <span className="text-2xl font-black text-amber-400 pb-5">:</span>
              <CountdownDigit value={time.seconds} label={t("seconds")} />
            </div>

            {/* Bonus Table */}
            <div className="mt-8 space-y-2">
              {BONUS_ROWS.map((row, i) => (
                <GlassCard
                  key={row.key}
                  className={`flex items-center justify-between px-4 py-3.5 ${
                    i % 2 === 0 ? "bg-white/[0.04] dark:bg-white/[0.02]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <row.icon className="h-5 w-5 text-amber-400 shrink-0" />
                    <span className="text-sm font-medium text-[var(--text-secondary)]">
                      {t(`${row.key}.label`)}
                    </span>
                  </div>
                  <GoldGradientText as="span" className="text-sm font-bold">
                    {t(`${row.key}.value`)}
                  </GoldGradientText>
                </GlassCard>
              ))}
            </div>

            {/* How bonuses work */}
            <div className="mt-6">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-secondary)] transition-colors"
              >
                {t("howBonusesWork")}
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="mt-2 text-xs leading-relaxed text-[var(--text-muted)] overflow-hidden"
                  >
                    {t("howBonusesWorkText")}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* CTA */}
            <div className="mt-8 text-center">
              <Link
                href="/auth/signup"
                onClick={() => track("cta_click", { section: "bonus", button: "claim" })}
              >
                <ShinyButton className="h-14 px-10 text-lg font-bold">
                  {t("cta")}
                </ShinyButton>
              </Link>
            </div>

            {/* Fine print */}
            <p className="mt-4 text-center text-[10px] text-[var(--text-muted)]/60">
              <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-[8px] font-black text-red-400">
                18+
              </span>
              {t("finePrint")}
            </p>
          </SpotlightCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
