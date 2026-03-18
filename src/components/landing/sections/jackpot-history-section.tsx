"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Trophy } from "lucide-react";
import { GlassCard, SectionHeadline } from "../ui/glass";
import CountUp from "@/components/ui/count-up";
import ScrollReveal from "@/components/ui/scroll-reveal";

interface JackpotWinner {
  name: string;
  game: string;
  amount: number;
  timeAgo: string;
}

function generateFakeWinners(): JackpotWinner[] {
  const names = [
    "Ke***l T.", "Ma***a S.", "Ah***d K.", "Le***a M.", "Ta***k B.",
    "Sa***a H.", "Am***a D.", "Iv***n P.", "Em***a K.", "Di***o M.",
  ];
  const games = ["Classic Slots", "5-Reel Deluxe", "Cascade Reels", "Megaways"];
  const times = [
    "2 min ago", "18 min ago", "1 hour ago", "3 hours ago", "5 hours ago",
    "Yesterday", "Yesterday", "2 days ago", "3 days ago", "5 days ago",
  ];
  return names.map((name, i) => ({
    name,
    game: games[i % games.length],
    amount: Math.floor(Math.random() * 400000 + 5000),
    timeAgo: times[i],
  }));
}

export function JackpotHistorySection() {
  const t = useTranslations("landing.jackpotHistory");
  const winners = useMemo(() => generateFakeWinners(), []);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <ScrollReveal>
          <SectionHeadline sub={t("subheadline")}>
            <span className="mr-2 inline-flex align-middle"><Trophy className="h-7 w-7 text-amber-400" /></span>{t("headline")}
          </SectionHeadline>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <GlassCard className="mt-10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)] text-left text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="px-4 py-3">{t("player")}</th>
                  <th className="hidden px-4 py-3 sm:table-cell">{t("game")}</th>
                  <th className="px-4 py-3 text-right">{t("amount")}</th>
                  <th className="hidden px-4 py-3 text-right sm:table-cell">{t("when")}</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w, i) => (
                  <tr
                    key={i}
                    className="border-b border-[var(--glass-border)]/50 last:border-0 transition-colors hover:bg-[var(--bg-card-hover)]"
                  >
                    <td className="px-4 py-3 font-medium text-[var(--text-secondary)]">
                      {i === 0 && <Trophy className="mr-1 inline h-4 w-4 text-amber-400" />}
                      {w.name}
                    </td>
                    <td className="hidden px-4 py-3 text-[var(--text-muted)] sm:table-cell">
                      {w.game}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400">
                      <CountUp to={w.amount} duration={1.5 + i * 0.1} separator="," />
                    </td>
                    <td className="hidden px-4 py-3 text-right text-[var(--text-muted)] sm:table-cell">
                      {w.timeAgo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </ScrollReveal>
      </div>
    </section>
  );
}
