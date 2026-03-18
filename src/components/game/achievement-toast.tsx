"use client";

import { toast } from "sonner";
import type { Achievement } from "@/lib/game/achievements";
import { RARITY_COLORS, RARITY_GLOW } from "@/lib/game/achievements";

const FRUITS = ["🍒","🍋","🍊","🍇","⭐","💎","🔮","🏆","💰","👑"];

function spawnFruitRain() {
  if (typeof document === "undefined") return;
  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const el = document.createElement("span");
      el.textContent = FRUITS[Math.floor(Math.random() * FRUITS.length)];
      el.style.cssText = `
        position: fixed;
        top: -2rem;
        left: ${Math.random() * 100}vw;
        font-size: ${1.2 + Math.random() * 1.5}rem;
        z-index: 99999;
        pointer-events: none;
        animation: fruit-fall ${2.5 + Math.random() * 2}s ease-in forwards;
        opacity: 1;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 80);
  }
}

export function showAchievementToast(achievement: Achievement) {
  spawnFruitRain();

  toast.custom((_id) => (
    <div
      className={`flex items-center gap-3 rounded-xl p-4 bg-[#0f0520] border border-white/10 shadow-2xl min-w-[280px]`}
      style={{ boxShadow: `0 0 30px ${RARITY_GLOW[achievement.rarity]}` }}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} text-2xl shadow-inner`}>
        {achievement.icon}
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">
          Achievement Unlocked!
        </div>
        <div className="mt-0.5 text-sm font-bold text-white">{achievement.title}</div>
        <div className="text-xs text-white/60">{achievement.description}</div>
        <div className="mt-1 text-[10px] text-amber-400 font-semibold">+{achievement.xp} XP</div>
      </div>
    </div>
  ), { duration: 5000 });
}

export function showChallengeCompleteToast(challengeTitle: string, credits: number) {
  spawnFruitRain();
  toast.success(`🏆 Challenge Complete: ${challengeTitle}! +${credits} credits`, {
    duration: 4000,
    style: { background: "#0f0520", border: "1px solid rgba(255,215,0,0.3)", color: "white" },
  });
}
