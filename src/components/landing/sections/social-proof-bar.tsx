"use client";

import { useState, useEffect, useRef } from "react";
import { Cherry, Star, Gem, Coins, Grape, Citrus, Trophy, Zap, type LucideIcon } from "lucide-react";
import { GlassPanel, PulsingDot } from "../ui/glass";

interface WinEvent {
  icon: LucideIcon;
  text: string;
  amount: number;
}

const WIN_POOL: WinEvent[] = [
  { icon: Cherry,  text: "Ahmed K. just won on Classic Slots",         amount: 4200 },
  { icon: Star,    text: "Maria S. triggered FREE SPINS on 5-Reel",    amount: 8500 },
  { icon: Coins,   text: "JACKPOT! Kemal T. smashed it!",              amount: 847293 },
  { icon: Zap,     text: "Lena M. won 12x multiplier on Cascade",      amount: 12000 },
  { icon: Star,    text: "Tarik B. hit 3 Wilds on Megaways",           amount: 2100 },
  { icon: Grape,   text: "Sara H. won on Classic Slots",               amount: 6500 },
  { icon: Trophy,  text: "Amila D. unlocked Bonus Round",              amount: 18200 },
  { icon: Gem,     text: "Ivan P. won on Cascade Reels",               amount: 15000 },
  { icon: Citrus,  text: "Emina K. hit triple fruit combo",            amount: 1800 },
  { icon: Cherry,  text: "Dino M. hit Cherry Triple",                  amount: 3200 },
  { icon: Star,    text: "Nina R. triggered 20 Free Spins",            amount: 22000 },
  { icon: Coins,   text: "Haris T. won on 5-Reel Deluxe",             amount: 9400 },
  { icon: Zap,     text: "Lejla S. won 7x multiplier",                 amount: 7000 },
  { icon: Trophy,  text: "Mirza A. hit Scatter Bonus",                 amount: 56000 },
  { icon: Grape,   text: "Aida B. won on Classic Slots",               amount: 2900 },
  { icon: Gem,     text: "Edin H. landed Diamond Triple",              amount: 22000 },
  { icon: Cherry,  text: "Maja K. hit 4 in a row",                     amount: 4800 },
  { icon: Star,    text: "Armin D. triggered Cascade Chain — 8x!",     amount: 12400 },
  { icon: Citrus,  text: "Selma R. won on Classic Slots",              amount: 1200 },
  { icon: Coins,   text: "Jasmin M. won on 5-Reel Deluxe",            amount: 11500 },
  { icon: Gem,     text: "Adna T. hit Diamond Triple",                 amount: 18000 },
  { icon: Zap,     text: "Damir S. won on Cascade Reels",              amount: 3700 },
  { icon: Trophy,  text: "Enis B. unlocked Mega Bonus Round",          amount: 67000 },
  { icon: Cherry,  text: "Lamija K. triggered Wild Expansion",         amount: 5400 },
  { icon: Star,    text: "Nermin D. won 25 Free Spins on Megaways",    amount: 31000 },
  { icon: Coins,   text: "Zlata H. hit the progressive jackpot",       amount: 124500 },
  { icon: Grape,   text: "Faruk M. won on Cascade Reels",              amount: 8900 },
  { icon: Gem,     text: "Belma C. hit Gemstone Cluster",              amount: 14200 },
  { icon: Zap,     text: "Sead R. won 15x multiplier on Megaways",     amount: 44000 },
  { icon: Trophy,  text: "Ilda S. triggered the Grand Jackpot",        amount: 210000 },
];

function formatAmount(n: number): string {
  return n.toLocaleString();
}

interface TickerItem {
  event: WinEvent;
  key: number;
}

export function SocialProofBar() {
  const [items, setItems] = useState<TickerItem[]>(() =>
    WIN_POOL.slice(0, 10).map((e, i) => ({ event: e, key: i }))
  );
  const keyRef = useRef(100);

  useEffect(() => {
    let poolIdx = 10;
    const schedule = (): ReturnType<typeof setTimeout> => {
      const delay = 8000 + Math.random() * 4000;
      return setTimeout(() => {
        const event = WIN_POOL[poolIdx % WIN_POOL.length];
        poolIdx++;
        keyRef.current++;
        setItems((prev) => [{ event, key: keyRef.current }, ...prev.slice(0, 25)]);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  const doubled = [...items, ...items];

  return (
    <section className="overflow-hidden">
      <GlassPanel className="border-y py-2.5">
        <div className="flex items-center">
          <div className="flex shrink-0 items-center gap-2 px-4 py-1 text-xs font-bold text-emerald-400 border-r border-[var(--glass-border)]">
            <PulsingDot color="bg-emerald-500 dark:bg-emerald-400" size="w-1.5 h-1.5" />
            LIVE
          </div>

          <div className="group relative flex overflow-hidden flex-1">
            <div className="animate-ticker flex shrink-0 gap-8 whitespace-nowrap group-hover:[animation-play-state:paused] pl-4">
              {doubled.map((item, i) => {
                const isHuge = item.event.amount >= 50000;
                const Icon = item.event.icon;
                return (
                  <span key={`${item.key}-${i}`} className="inline-flex items-center gap-2 text-sm">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isHuge ? "text-amber-300" : "text-amber-400"}`} />
                    <span className={isHuge ? "text-amber-200 font-semibold" : "text-[var(--text-secondary)]"}>
                      {item.event.text}
                    </span>
                    <span className={`font-bold tabular-nums ${isHuge ? "text-amber-300" : "text-amber-500 dark:text-amber-400"}`}>
                      +{formatAmount(item.event.amount)}
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[var(--glass-bg)] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[var(--glass-bg)] to-transparent" />
          </div>
        </div>
      </GlassPanel>
    </section>
  );
}
