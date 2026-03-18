"use client";

import { useTranslations } from "next-intl";
import { SectionHeadline } from "../ui/glass";
import SpotlightCard from "@/components/ui/spotlight-card";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface Testimonial {
  name: string;
  country: string;
  flag: string;
  stars: number;
  quoteKey: string;
  initials: string;
  gradFrom: string;
  gradTo: string;
}

const TESTIMONIALS: Testimonial[] = [
  { name: "Ahmed K.", country: "Bosnia", flag: "🇧🇦", stars: 5, quoteKey: "t1", initials: "AK", gradFrom: "#f59e0b", gradTo: "#d97706" },
  { name: "Maria S.", country: "Germany", flag: "🇩🇪", stars: 5, quoteKey: "t2", initials: "MS", gradFrom: "#ec4899", gradTo: "#db2777" },
  { name: "James R.", country: "UK", flag: "🇬🇧", stars: 4, quoteKey: "t3", initials: "JR", gradFrom: "#38bdf8", gradTo: "#0284c7" },
  { name: "Lejla M.", country: "Bosnia", flag: "🇧🇦", stars: 5, quoteKey: "t4", initials: "LM", gradFrom: "#34d399", gradTo: "#059669" },
  { name: "Tarik B.", country: "Turkey", flag: "🇹🇷", stars: 5, quoteKey: "t5", initials: "TB", gradFrom: "#a78bfa", gradTo: "#7c3aed" },
  { name: "Nina P.", country: "Croatia", flag: "🇭🇷", stars: 4, quoteKey: "t6", initials: "NP", gradFrom: "#fb923c", gradTo: "#ea580c" },
];

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < stars ? "text-amber-400 text-sm" : "text-[var(--glass-border)] text-sm"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <SectionHeadline>
            {t("headline")}
          </SectionHeadline>
          <div className="mt-3 flex items-center justify-center gap-2">
            <StarRating stars={5} />
            <span className="text-sm font-bold text-amber-400">4.8/5</span>
            <span className="text-sm text-[var(--text-muted)]">{t("ratingCount")}</span>
          </div>
        </ScrollReveal>

        <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {TESTIMONIALS.map((item, i) => (
            <ScrollReveal key={item.quoteKey} delay={i * 0.08}>
              <div className="mb-4 break-inside-avoid">
                <SpotlightCard
                  className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-5"
                  spotlightColor="rgba(139, 92, 246, 0.12)"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${item.gradFrom}, ${item.gradTo})` }}
                    >
                      {item.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{item.name}</span>
                        <span>{item.flag}</span>
                      </div>
                      <StarRating stars={item.stars} />
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                    &ldquo;{t(item.quoteKey)}&rdquo;
                  </p>
                </SpotlightCard>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
