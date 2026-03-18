"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { UserPlus, Gift, Trophy } from "lucide-react";
import { GlassCard, SectionHeadline, GoldGradientText } from "../ui/glass";
import ShinyButton from "@/components/ui/shiny-button";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";

const STEPS = [
  { number: "1", icon: UserPlus, key: "step1" },
  { number: "2", icon: Gift, key: "step2" },
  { number: "3", icon: Trophy, key: "step3" },
] as const;

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");
  const { track } = useConversionTracker();

  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-5xl px-4">
        <ScrollReveal>
          <SectionHeadline>{t("headline")}</SectionHeadline>
        </ScrollReveal>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.key} delay={i * 0.15}>
              <div className="relative text-center">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[calc(50%+40px)] top-10 hidden h-0.5 w-[calc(100%+24px)] md:block"
                    style={{ background: "linear-gradient(90deg, var(--bg-card-border) 0%, transparent 100%)" }} />
                )}

                {/* Number circle */}
                <GlassCard className="mx-auto w-20 h-20 flex items-center justify-center rounded-full">
                  <GoldGradientText as="span" className="text-3xl font-black">
                    {step.number}
                  </GoldGradientText>
                </GlassCard>

                {/* Icon */}
                <div className="mt-4 flex justify-center">
                  <step.icon className="h-9 w-9 text-amber-400" />
                </div>

                {/* Text */}
                <h3 className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                  {t(`${step.key}.title`)}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {t(`${step.key}.description`)}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.45}>
          <div className="mt-12 text-center">
            <Link
              href="/auth/signup"
              onClick={() => track("cta_click", { section: "how_it_works", button: "get_started" })}
            >
              <ShinyButton className="h-14 px-8 text-lg font-bold">
                {t("cta")}
              </ShinyButton>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
