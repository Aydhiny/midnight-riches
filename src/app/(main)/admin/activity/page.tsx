"use client";

import { useEffect, useState } from "react";
import { getRecentSessions, getSpinChartData } from "@/server/actions/admin";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

type Session = {
  id: string; email: string; gameId: string;
  betAmount: number; winAmount: number; outcome: string; createdAt: Date;
};

function fmtCurrency(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtTime(d: Date) {
  return new Date(d).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}
function fmtDateShort(d: string) {
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

export default function AdminActivityPage() {
  const [sessions, setSessions]   = useState<Session[]>([]);
  const [spinData, setSpinData]   = useState<Array<{ date: string; spins: number; wagered: number; payouts: number }>>([]);
  const [loading,  setLoading]    = useState(true);
  const [filter,   setFilter]     = useState<"all" | "win" | "loss" | "bonus">("all");

  useEffect(() => {
    Promise.all([
      getRecentSessions(50),
      getSpinChartData(30),
    ]).then(([s, c]) => {
      if (s.success) setSessions(s.data.sessions);
      if (c.success) setSpinData(c.data.daily);
      setLoading(false);
    });
  }, []);

  const filtered = filter === "all" ? sessions : sessions.filter((s) => s.outcome === filter);

  const winCount  = sessions.filter((s) => s.outcome === "win").length;
  const bonusCount = sessions.filter((s) => s.outcome === "bonus").length;
  const winRate   = sessions.length > 0 ? (winCount / sessions.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Activity Feed</h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Live game sessions and spin patterns</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Sessions", value: sessions.length.toLocaleString(), color: "#7c3aed" },
          { label: "Win Rate",       value: `${winRate.toFixed(1)}%`,          color: "#22c55e" },
          { label: "Bonus Rounds",   value: bonusCount.toLocaleString(),       color: "#f59e0b" },
          { label: "Total Volume",   value: fmtCurrency(sessions.reduce((a, s) => a + s.betAmount, 0)), color: "#fbbf24" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-4"
          >
            {loading ? (
              <Sk className="h-8" />
            ) : (
              <>
                <p className="text-xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{s.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 30-day chart */}
      <div
        className="rounded-2xl border border-[var(--glass-border)] p-5"
        style={{ background: "var(--glass-bg)" }}
      >
        <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">Volume — Last 30 Days</p>
        {loading ? (
          <Sk className="h-48" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={spinData.map((d) => ({
              ...d,
              date: fmtDateShort(d.date),
            }))}>
              <defs>
                <linearGradient id="wagGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={42}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "rgba(8,2,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 11 }}
                labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                itemStyle={{ color: "#f59e0b" }}
              />
              <Area type="monotone" dataKey="wagered" name="Wagered $" stroke="#f59e0b" fill="url(#wagGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Session feed */}
      <div
        className="rounded-2xl border border-[var(--glass-border)] p-5"
        style={{ background: "var(--glass-bg)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--text-primary)]">Recent Sessions</p>
          <div className="flex gap-1">
            {(["all", "win", "loss", "bonus"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold capitalize transition-all ${
                  filter === f
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Sk key={i} className="h-10" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  {["Player", "Game", "Bet", "Win", "Outcome", "Time"].map((h) => (
                    <th key={h} className="pb-2 pr-3 text-left font-semibold text-[var(--text-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--glass-border)] border-opacity-30 hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-mono text-[10px] text-[var(--text-muted)] max-w-[140px] truncate">
                      {s.email}
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--text-secondary)] capitalize">
                      {s.gameId.replace(/-/g, " ")}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums text-[var(--text-secondary)]">
                      {fmtCurrency(s.betAmount)}
                    </td>
                    <td className={`py-2.5 pr-3 tabular-nums font-bold ${s.winAmount > 0 ? "text-emerald-400" : "text-[var(--text-muted)] opacity-40"}`}>
                      {s.winAmount > 0 ? `+${fmtCurrency(s.winAmount)}` : "—"}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        s.outcome === "win"   ? "bg-emerald-500/15 text-emerald-400" :
                        s.outcome === "bonus" ? "bg-amber-500/15 text-amber-400"    :
                        "bg-white/[0.05] text-[var(--text-muted)]"
                      }`}>
                        {s.outcome}
                      </span>
                    </td>
                    <td className="py-2.5 text-[var(--text-muted)]">{fmtTime(s.createdAt)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-sm text-[var(--text-muted)] opacity-50">No sessions match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
