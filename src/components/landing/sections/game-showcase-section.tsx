"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cherry, Star, Gem, Hash, type LucideIcon } from "lucide-react";
import { GlassCard, GlassPill, SectionHeadline } from "../ui/glass";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { useConversionTracker } from "@/lib/analytics/conversion";
import {
  ClassicSlotPreview,
  FiveReelPreview,
  CascadeReelPreview,
  MegawaysPreview,
} from "../visuals/game-previews";

type PreviewComponent = React.ComponentType;

const GAMES: {
  id: string;
  glowColor: string;
  stats: string[];
  features: string[];
  icon: LucideIcon;
  accent: string;
  badge?: { label: string; color: string };
  Preview: PreviewComponent;
}[] = [
  {
    id: "classic",
    glowColor: "rgba(251,191,36,0.4)",
    stats: ["5 Paylines", "100x Max Win"],
    features: ["Wild", "Scatter", "Free Spins"],
    icon: Cherry,
    accent: "from-amber-400 to-orange-400",
    badge: { label: "🔥 HOT", color: "bg-orange-500/20 text-orange-400 border-orange-400/30" },
    Preview: ClassicSlotPreview,
  },
  {
    id: "fiveReel",
    glowColor: "rgba(139,92,246,0.4)",
    stats: ["20 Paylines", "200x Max Win"],
    features: ["Wild", "Expanding Wild", "Scatter", "Free Spins"],
    icon: Star,
    accent: "from-violet-400 to-purple-500",
    Preview: FiveReelPreview,
  },
  {
    id: "cascade",
    glowColor: "rgba(52,211,153,0.4)",
    stats: ["20 Paylines", "Chain Multipliers"],
    features: ["Cascade", "Wild", "Scatter", "Multiplier"],
    icon: Gem,
    accent: "from-emerald-400 to-teal-500",
    Preview: CascadeReelPreview,
  },
  {
    id: "megaways",
    glowColor: "rgba(244,114,182,0.4)",
    stats: ["Up to 117,649 Ways", "500x Max Win"],
    features: ["Megaways", "Wild", "Free Spins", "Expanding Reels"],
    icon: Hash,
    accent: "from-pink-400 to-rose-500",
    badge: { label: "✨ NEW", color: "bg-violet-500/20 text-violet-300 border-violet-400/30" },
    Preview: MegawaysPreview,
  },
];

export function GameShowcaseSection() {
  const t = useTranslations("landing.games");
  const { track } = useConversionTracker();

  return (
    <section id="games" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <ScrollReveal>
          <SectionHeadline sub={t("subheadline")}>{t("headline")}</SectionHeadline>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {GAMES.map((game, i) => (
            <ScrollReveal key={game.id} delay={i * 0.1}>
              <div
                className="group relative rounded-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                style={{ ["--glow" as string]: game.glowColor }}
              >
                <GlassCard
                  className="p-5 h-full transition-all duration-300 group-hover:border-[var(--glow)] group-hover:shadow-[0_8px_32px_var(--glow)]"
                  hover
                >
                  {game.badge && (
                    <span
                      className={`absolute -top-2.5 right-4 rounded-full border px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${game.badge.color}`}
                    >
                      {game.badge.label}
                    </span>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">
                        {t(`${game.id}.name`)}
                      </h3>
                      <GlassPill
                        className={`mt-1.5 bg-gradient-to-r ${game.accent} bg-clip-text text-transparent border-white/20`}
                      >
                        {t(`${game.id}.variant`)}
                      </GlassPill>
                    </div>
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${game.glowColor.replace("0.4", "0.6")}, ${game.glowColor.replace("0.4", "0.3")})`,
                      }}
                    >
                      <game.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {/* Game preview — shows a live slot grid */}
                  <div className="mb-3">
                    <game.Preview />
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2">
                    {game.stats.map((stat) => (
                      <GlassPill key={stat} className="text-amber-500 dark:text-amber-400 border-amber-400/20 text-[10px]">
                        {stat}
                      </GlassPill>
                    ))}
                  </div>

                  {/* Features */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {game.features.map((feat) => (
                      <span
                        key={feat}
                        className="rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  <Link
                    href="/game"
                    onClick={() => track("cta_click", { section: "games", game: game.id })}
                    className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold bg-gradient-to-r ${game.accent} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}
                  >
                    {t("playNow")} →
                  </Link>
                </GlassCard>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
