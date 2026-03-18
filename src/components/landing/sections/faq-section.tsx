"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, SectionHeadline } from "../ui/glass";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import ScrollReveal from "@/components/ui/scroll-reveal";

const FAQ_KEYS = [
  "freeToPlay",
  "welcomeBonus",
  "fairGames",
  "jackpotWorks",
  "mobilePlay",
  "paymentMethods",
  "withdrawWinnings",
  "dataSecure",
] as const;

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <GlowingEffect disabled={!isOpen} proximity={60} spread={18} color="rgba(139,92,246,0.3)" className="rounded-xl">
      <GlassCard
        className={`transition-all duration-300 ${isOpen ? "bg-[var(--bg-card-hover)] border-[var(--bg-card-border)]" : ""}`}
      >
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-between p-4 text-left text-sm font-medium text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors"
          aria-expanded={isOpen}
        >
          <span className="pr-4">{question}</span>
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-[var(--text-muted)]"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M4 6l4 4 4-4" />
          </motion.svg>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="px-4 pb-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                {answer}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </GlowingEffect>
  );
}

export function FAQSection() {
  const t = useTranslations("landing.faq");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-3xl px-4">
        <ScrollReveal>
          <SectionHeadline>{t("headline")}</SectionHeadline>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mt-10 space-y-2">
            {FAQ_KEYS.map((key, i) => (
              <AccordionItem
                key={key}
                question={t(`${key}.q`)}
                answer={t(`${key}.a`)}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </div>
        </ScrollReveal>

        {/* FAQ Schema (SEO) */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_KEYS.map((key) => ({
                "@type": "Question",
                name: t(`${key}.q`),
                acceptedAnswer: { "@type": "Answer", text: t(`${key}.a`) },
              })),
            }),
          }}
        />
      </div>
    </section>
  );
}
