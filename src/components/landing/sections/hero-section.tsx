"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Shield, Zap, CheckCircle, Globe, Flame, Timer } from "lucide-react";
import { useConversionTracker } from "@/lib/analytics/conversion";
import { useHeroVariant } from "@/lib/analytics/ab";
import { DemoSlot } from "./demo-slot";
import { HeroBackground } from "./hero-background";
import { LiveBadge } from "./live-badge";
import AnimatedContent from "@/components/ui/animated-content";
import ClickSpark from "@/components/ui/click-spark";
import ShinyButton from "@/components/ui/shiny-button";
import StarBorder from "@/components/ui/star-border";
import { GlassCard, GlassPill, PulsingDot } from "../ui/glass";

const BackgroundReel = dynamic(() => import("../visuals/background-reel").then((m) => ({ default: m.BackgroundReel })), { ssr: false });
const CardSuitsParallax = dynamic(() => import("../visuals/card-suits-parallax").then((m) => ({ default: m.CardSuitsParallax })), {
  ssr: false,
});
const GodRays = dynamic(() => import("../visuals/god-rays").then((m) => ({ default: m.GodRays })), { ssr: false });

const RECENT_WINNERS = [
  { name: "Ke***l T.", amount: "124,500", mins: 3 },
  { name: "Ma***a S.", amount: "87,200", mins: 7 },
  { name: "Ah***d K.", amount: "210,000", mins: 11 },
  { name: "Le***a M.", amount: "56,800", mins: 2 },
  { name: "Ta***k B.", amount: "144,000", mins: 9 },
  { name: "Sa***a H.", amount: "93,600", mins: 4 },
  { name: "Iv***n P.", amount: "315,000", mins: 6 },
  { name: "Am***a D.", amount: "71,500", mins: 14 },
];

function secsToNextQuarter(): number {
  const now = new Date();
  const totalSecs = now.getSeconds() + now.getMinutes() * 60;
  const quarter = Math.ceil((totalSecs + 1) / 900) * 900;
  return Math.max(1, quarter - totalSecs);
}

function useJackpot(initial: number) {
  const [jackpot, setJackpot] = useState(initial);
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
    scheduleNext();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  return { jackpot, flash };
}

export function HeroSection() {
  const t = useTranslations("landing.hero");
  const { track } = useConversionTracker();
  const { headline } = useHeroVariant();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const { jackpot, flash } = useJackpot(847293 + Math.floor(Math.random() * 50000));

  // Cycling last winner
  const [winnerIdx, setWinnerIdx] = useState(0);
  const [winnerVisible, setWinnerVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setWinnerVisible(false);
      setTimeout(() => {
        setWinnerIdx((i) => (i + 1) % RECENT_WINNERS.length);
        setWinnerVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Jackpot countdown
  const [jackpotSecs, setJackpotSecs] = useState(secsToNextQuarter);
  useEffect(() => {
    const interval = setInterval(() => {
      setJackpotSecs((s) => (s <= 1 ? secsToNextQuarter() : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(jackpotSecs / 60);
  const secs = jackpotSecs % 60;
  const winner = RECENT_WINNERS[winnerIdx];

  const trustBadges = [
    { icon: Shield, label: t("trustSecure") },
    { icon: Zap, label: t("trustInstant") },
    { icon: CheckCircle, label: t("trustFair") },
    { icon: Globe, label: t("trustMultilingual") },
  ] as const;

  return (
    <section id="hero" className="relative flex min-h-screen items-center pt-16 overflow-hidden">
      <HeroBackground isDark={isDark} />
      <BackgroundReel side="left" isDark={isDark} />
      <BackgroundReel side="right" isDark={isDark} />
      <GodRays isDark={isDark} />
      <CardSuitsParallax />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:py-0">
        {/* ── Left — Copy ────────────────────────────────────── */}
        <div className="flex flex-col justify-center">
          <AnimatedContent delay={0} direction="vertical" distance={20}>
            <LiveBadge />
          </AnimatedContent>

          {/* Main headline */}
          <AnimatedContent delay={0.12} direction="vertical" distance={20}>
            <h1
              className={[
                "mt-5 text-[clamp(1.9rem,4.5vw,3.4rem)] font-black leading-tight tracking-tight",
                isDark
                  ? "bg-gradient-to-r from-violet-300 via-purple-200 to-pink-300"
                  : "bg-gradient-to-r from-violet-700 via-purple-600 to-pink-600",
                "bg-clip-text text-transparent",
              ].join(" ")}
            >
              {t(headline)}
            </h1>
          </AnimatedContent>

          {/* "Start Now." — Cormorant Garamond bold italic, dominant */}
          <AnimatedContent delay={0.22} direction="vertical" distance={24}>
            <div
              className="leading-[0.88]"
              style={{
                fontFamily: "var(--font-garamond)",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: "clamp(4rem, 12vw, 8rem)",
                background: isDark
                  ? "linear-gradient(to bottom, #ffffff 0%, #e4e4e7 40%, #a1a1aa 100%)"
                  : "linear-gradient(to bottom, #1a0533 0%, #4a1d8a 40%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.09em",
                filter: isDark
                  ? "drop-shadow(0 2px 10px rgba(0,0,0,0.03))"
                  : "drop-shadow(0 2px 12px rgba(124,58,237,0.15))",
                display: "inline-block",
              }}
            >
              start now.
            </div>
          </AnimatedContent>

          {/* Subheadline */}
          <AnimatedContent delay={0.35} direction="vertical" distance={20}>
            <p className="mt-4 text-base md:text-lg text-[var(--text-secondary)] max-w-lg leading-relaxed">{t("subheadline")}</p>
          </AnimatedContent>

          {/* Jackpot Display */}
          <AnimatedContent delay={0.45} direction="vertical" distance={20}>
            <GlassCard
              className="mt-6 inline-flex items-center gap-4 px-6 py-4 hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] transition-all duration-300 cursor-default"
              hover
            >
              <div>
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <PulsingDot color="bg-orange-400" size="w-1.5 h-1.5" />
                  {t("currentJackpot")}
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className="text-3xl font-black tabular-nums text-amber-400 md:text-4xl"
                    style={flash ? { animation: "jackpotFlash 0.4s ease-out" } : undefined}
                  >
                    {jackpot.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-[var(--text-muted)]">{t("credits")}</span>
                </div>
              </div>
            </GlassCard>
          </AnimatedContent>

          {/* CTAs */}
          <AnimatedContent delay={0.55} direction="vertical" distance={20}>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <ClickSpark sparkColor="#FFD700" sparkCount={14} sparkRadius={20}>
                <Link href="/auth/signup" onClick={() => track("cta_click", { section: "hero", button: "primary" })}>
                  <ShinyButton className="h-13 px-7 text-base font-bold">{t("primaryCta")}</ShinyButton>
                </Link>
              </ClickSpark>

              <StarBorder
                as="a"
                href="#how-it-works"
                color="#7c3aed"
                speed="4s"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  track("cta_click", { section: "hero", button: "secondary" });
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-sm font-medium text-[var(--text-secondary)]"
              >
                {t("secondaryCta")}
              </StarBorder>
            </div>
          </AnimatedContent>

          {/* Urgency stack */}
          <AnimatedContent delay={0.65} direction="vertical" distance={16}>
            <div className="mt-5 flex flex-col gap-2">
              <GlassPill className="w-fit gap-2 text-[11px] text-[var(--text-secondary)]">
                <Flame className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                <span>
                  <strong className="text-orange-400">847</strong> people signed up in the last hour
                </span>
              </GlassPill>

              <GlassPill className="w-fit gap-2 text-[11px] text-[var(--text-secondary)]">
                <Timer className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <span>
                  Next jackpot draw in{" "}
                  <strong className="text-amber-400 tabular-nums">
                    {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
                  </strong>
                </span>
              </GlassPill>

              <div style={{ transition: "opacity 0.4s ease", opacity: winnerVisible ? 1 : 0 }}>
                <GlassPill className="w-fit gap-2 text-[11px] text-[var(--text-secondary)]">
                  <span className="shrink-0">🏆</span>
                  <span>
                    Last winner: <strong className="text-amber-400">{winner.name}</strong> won{" "}
                    <strong className="text-amber-400">{winner.amount}</strong> credits —{" "}
                    <span className="text-[var(--text-muted)]">{winner.mins} min ago</span>
                  </span>
                </GlassPill>
              </div>
            </div>
          </AnimatedContent>

          {/* Trust badges */}
          <AnimatedContent delay={0.78} direction="vertical" distance={15}>
            <div className="mt-5 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <GlassPill key={badge.label} className="text-[var(--text-muted)] text-[11px]">
                  <badge.icon className="h-3.5 w-3.5" />
                  <span>{badge.label}</span>
                </GlassPill>
              ))}
            </div>
          </AnimatedContent>
        </div>

        {/* ── Right — Demo Slot ────────────────────────────────── */}
        <AnimatedContent delay={0.3} direction="horizontal" distance={40}>
          <div className="flex items-center justify-center">
            <div className="w-full max-w-[380px]">
              <DemoSlot />
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
