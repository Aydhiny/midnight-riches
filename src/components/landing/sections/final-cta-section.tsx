"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { GlassCard, PulsingDot } from "../ui/glass";
import CountUp from "@/components/ui/count-up";
import ClickSpark from "@/components/ui/click-spark";
import ShinyButton from "@/components/ui/shiny-button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";

const CARD_SUITS = [
  { char: "\u2660", x: 8, y: 12 },
  { char: "\u2665", x: 85, y: 18 },
  { char: "\u2666", x: 15, y: 72 },
  { char: "\u2663", x: 78, y: 68 },
  { char: "\u2660", x: 50, y: 8 },
  { char: "\u2665", x: 42, y: 82 },
];

const JACKPOT_BASE = 847293;

function useJackpot() {
  const [jackpot, setJackpot] = useState(JACKPOT_BASE);
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    const delay = 3000 + Math.random() * 4000;
    timerRef.current = setTimeout(() => {
      const isBig = Math.random() < 0.08;
      if (isBig) {
        setFlash(true);
        setTimeout(() => setFlash(false), 500);
        setJackpot((prev) => prev + Math.floor(Math.random() * 1200) + 800);
      } else {
        setJackpot((prev) => prev + Math.floor(Math.random() * 101) + 50);
      }
      scheduleNext();
    }, delay);
  }, []);

  useEffect(() => {
    setJackpot(JACKPOT_BASE + Math.floor(Math.random() * 50000));
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  return { jackpot, flash };
}

export function FinalCTASection() {
  const t = useTranslations("landing.finalCta");
  const { track } = useConversionTracker();
  const { jackpot, flash } = useJackpot();

  return (
    <section className="relative overflow-hidden py-32">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: "var(--cta-bg-radial)" }} />
        <div
          className="absolute -left-1/4 bottom-0 w-3/4 h-3/4"
          style={{ background: "var(--cta-rose-bloom)" }}
        />
        <div
          className="absolute -right-1/4 -top-1/4 w-3/4 h-3/4"
          style={{ background: "var(--cta-gold-bloom)" }}
        />
      </div>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "128px",
          opacity: "var(--cta-grain-opacity)" as unknown as number,
          mixBlendMode: "overlay",
        }}
      />

      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none select-none" aria-hidden="true">
        {CARD_SUITS.map((suit, i) => (
          <span
            key={i}
            className="absolute text-4xl md:text-5xl"
            style={{
              left: `${suit.x}%`,
              top: `${suit.y}%`,
              opacity: "var(--cta-suit-opacity)" as unknown as number,
              color: "var(--text-muted)",
              animation: `float-up ${10 + i * 2.5}s ease-in-out infinite`,
              animationDelay: `${i * 1.5}s`,
              filter: "blur(0.5px)",
            }}
          >
            {suit.char}
          </span>
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <ScrollReveal>
          <h2
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight bg-clip-text text-transparent"
            style={{
              fontFamily: "var(--font-garamond)",
              fontWeight: 700,
              fontStyle: "italic",
              backgroundImage: "var(--cta-headline-gradient)",
            }}
          >
            {t("headline")}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <GlassCard
            className="mx-auto mt-10 inline-flex flex-col items-center gap-2 px-6 py-5 sm:px-10 sm:py-7 hover:shadow-[0_0_60px_rgba(255,215,0,0.25)] transition-all duration-300"
            hover
          >
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
              <span className="relative flex items-center gap-1.5">
                <PulsingDot color="bg-red-500" size="w-2 h-2" />
                <span className="text-red-400 font-bold tracking-widest">LIVE</span>
              </span>
              <span className="mx-1 text-[var(--glass-border)]">|</span>
              {t("jackpotLabel")}
            </div>
            <div
              className="text-4xl sm:text-5xl md:text-7xl font-black tabular-nums text-amber-400"
              style={flash ? { animation: "jackpotFlash 0.4s ease-out" } : undefined}
            >
              <CountUp to={jackpot} duration={1.5} separator="," />
            </div>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ClickSpark sparkColor="#FFD700" sparkCount={18} sparkRadius={24}>
              <Link
                href="/auth/signup"
                onClick={() => track("cta_click", { section: "final_cta", button: "create_account" })}
              >
                <ShinyButton className="h-14 px-10 text-lg font-bold">
                  {t("primaryCta")}
                </ShinyButton>
              </Link>
            </ClickSpark>

            <Link
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                track("cta_click", { section: "final_cta", button: "try_demo" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-8 py-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all duration-200"
            >
              {t("secondaryCta")}
            </Link>
          </div>

          <p className="mt-7 text-sm text-[var(--text-muted)]">{t("playerCount")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
}
