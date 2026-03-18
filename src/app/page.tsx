"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { LandingNav } from "@/components/landing/sections/landing-nav";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { SocialProofBar } from "@/components/landing/sections/social-proof-bar";
import { BonusOfferSection } from "@/components/landing/sections/bonus-offer-section";
import { GameShowcaseSection } from "@/components/landing/sections/game-showcase-section";
import { HowItWorksSection } from "@/components/landing/sections/how-it-works-section";
import { JackpotHistorySection } from "@/components/landing/sections/jackpot-history-section";
import { TestimonialsSection } from "@/components/landing/sections/testimonials-section";
import { FAQSection } from "@/components/landing/sections/faq-section";
import { FinalCTASection } from "@/components/landing/sections/final-cta-section";
import { LandingFooter } from "@/components/landing/sections/landing-footer";
import { ExitIntentModal } from "@/components/landing/sections/exit-intent-modal";
import { JackpotInfoModal } from "@/components/landing/sections/jackpot-info-modal";
import { SmoothScrollProvider } from "@/components/landing/providers/smooth-scroll-provider";
import { AmbientOrbs } from "@/components/landing/visuals/ambient-orbs";

const ROTATING_TITLES = [
  "🎰 Midnight Riches — 500 Free Credits Waiting!",
  "🏆 Someone just won 124,500 credits!",
  "⚡ Claim Your Welcome Bonus — No Card Needed",
  "💎 The Jackpot is Growing Every Second...",
  "🍒 Start Spinning for Free — Join 12,400+ Players",
  "🔥 847 People Signed Up in the Last Hour",
  "👑 Your Next Big Win Starts Here",
];

function RotatingTitle() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % ROTATING_TITLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.title = ROTATING_TITLES[idx];
  }, [idx]);

  return null;
}

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Default to dark on SSR — matches next-themes default theme so no hydration mismatch
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <SmoothScrollProvider>
      <RotatingTitle />
      <AmbientOrbs isDark={isDark} />
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <LandingNav />
        <HeroSection />
        <SocialProofBar />
        <BonusOfferSection />
        <GameShowcaseSection />
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <JackpotHistorySection />
        <TestimonialsSection />
        <div id="faq">
          <FAQSection />
        </div>
        <FinalCTASection />
        <LandingFooter />
        <ExitIntentModal />
        <JackpotInfoModal />
      </div>
    </SmoothScrollProvider>
  );
}
