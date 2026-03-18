"use client";

import { useEffect, useState, useTransition } from "react";
import { getDailyChallengesProgressAction } from "@/server/actions/achievements";

interface ChallengeData {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  rewardXp: number;
  rewardCredits: number;
  progress: number;
  completed: boolean;
}

export function DailyChallengesWidget() {
  const [challenges, setChallenges] = useState<ChallengeData[]>([]);
  const [isLoading, startLoading] = useTransition();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    startLoading(async () => {
      const data = await getDailyChallengesProgressAction();
      setChallenges(data.challenges);
    });
  }, []); // Run once on mount

  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <div className="text-left">
            <div className="text-xs font-bold text-[var(--text-primary)]">Daily Challenges</div>
            <div className="text-[10px] text-[var(--text-muted)]">
              {completedCount}/{challenges.length} completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Progress dots */}
          <div className="flex gap-1">
            {challenges.map(c => (
              <div
                key={c.id}
                className={`h-2 w-2 rounded-full ${c.completed ? "bg-emerald-400" : "bg-white/20"}`}
              />
            ))}
          </div>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--glass-border)] p-3 space-y-2">
          {isLoading ? (
            <div className="flex h-16 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
            </div>
          ) : challenges.length === 0 ? (
            <div className="text-center py-4 text-xs text-[var(--text-muted)]">Loading challenges…</div>
          ) : (
            challenges.map(challenge => {
              const pct = Math.min(100, Math.round((challenge.progress / challenge.target) * 100));
              return (
                <div key={challenge.id} className={`rounded-lg p-2.5 ${challenge.completed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/[0.03] border border-white/[0.06]"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{challenge.icon}</span>
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--text-primary)]">
                          {challenge.title}
                          {challenge.completed && <span className="ml-1 text-emerald-400">✓</span>}
                        </div>
                        <div className="text-[9px] text-[var(--text-muted)]">{challenge.description}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[9px] text-amber-500 font-semibold">+{challenge.rewardXp} XP</div>
                      <div className="text-[9px] text-emerald-500">+{challenge.rewardCredits}cr</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${challenge.completed ? "bg-emerald-400" : "bg-gradient-to-r from-violet-500 to-pink-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-0.5 text-right text-[9px] text-[var(--text-muted)]">
                    {challenge.progress}/{challenge.target}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
