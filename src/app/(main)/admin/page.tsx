"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, TrendingUp, TrendingDown, Zap, Trophy, BarChart3, Activity, Shield,
} from "lucide-react";
import {
  getAdminKPIs,
  getSpinChartData,
  getUserGrowthData,
  getTopPlayers,
  getRecentSessions,
} from "@/server/actions/admin";
import type { AdminKPIs } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(v: number) {
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function fmtCurrency(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en", { month: "short", day: "numeric" });
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, glow, trend,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string; glow: string; trend?: "up" | "down" | null;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5"
      style={{
        background: `${color}0d`,
        borderColor: `${color}33`,
        boxShadow: `0 0 30px ${glow}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: `${color}1a`, border: `1px solid ${color}30` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend === "up"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend === "up" ? "Live" : "Low"}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
        <p className="mt-0.5 text-xs font-semibold text-[var(--text-muted)]">{label}</p>
        {sub && <p className="mt-1 text-[10px] text-[var(--text-muted)] opacity-60">{sub}</p>}
      </div>
    </div>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl border border-[var(--glass-border)] p-3 text-xs backdrop-blur-xl"
      style={{ background: "rgba(8,2,22,0.95)" }}
    >
      <p className="mb-2 font-bold text-[var(--text-secondary)]">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("$") ? fmtCurrency(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const [kpis,     setKpis]     = useState<AdminKPIs | null>(null);
  const [spinData, setSpinData] = useState<Array<{ date: string; spins: number; wagered: number; payouts: number }>>([]);
  const [growData, setGrowData] = useState<Array<{ date: string; registrations: number }>>([]);
  const [topP,     setTopP]     = useState<Array<{ id: string; name: string | null; email: string; totalWagered: number; totalWon: number; spins: number }>>([]);
  const [recent,   setRecent]   = useState<Array<{ id: string; email: string; gameId: string; betAmount: number; winAmount: number; outcome: string; createdAt: Date }>>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminKPIs(),
      getSpinChartData(14),
      getUserGrowthData(),
      getTopPlayers(8),
      getRecentSessions(15),
    ]).then(([k, s, g, t, r]) => {
      if (k.success) setKpis(k.data);
      if (s.success) setSpinData(s.data.daily);
      if (g.success) setGrowData(g.data.daily);
      if (t.success) setTopP(t.data.players);
      if (r.success) setRecent(r.data.sessions);
      setLoading(false);
    });
  }, []);

  const houseProfit = kpis ? kpis.totalRevenue - kpis.totalPayouts : 0;

  const KPI_CARDS = kpis ? [
    { label: "Total Users",    value: fmt(kpis.totalUsers),              sub: "all time",             icon: Users,    color: "#7c3aed", glow: "rgba(124,58,237,0.15)", trend: null      },
    { label: "Active Today",   value: fmt(kpis.activeUsersToday),        sub: "unique sessions",      icon: Activity, color: "#22c55e", glow: "rgba(34,197,94,0.12)",  trend: "up" as const },
    { label: "House Edge",     value: `${kpis.houseEdge.toFixed(2)}%`,   sub: "net profitability",    icon: BarChart3,color: "#f59e0b", glow: "rgba(245,158,11,0.12)", trend: null      },
    { label: "Total Revenue",  value: fmtCurrency(kpis.totalRevenue),    sub: "purchase transactions",icon: Zap,      color: "#fbbf24", glow: "rgba(251,191,36,0.12)", trend: null      },
    { label: "Total Payouts",  value: fmtCurrency(kpis.totalPayouts),    sub: "player wins",          icon: Trophy,   color: "#ec4899", glow: "rgba(236,72,153,0.12)", trend: null      },
    { label: "Active Jackpot", value: fmtCurrency(kpis.activeJackpot),   sub: "current pool",         icon: Shield,   color: "#38bdf8", glow: "rgba(56,189,248,0.12)", trend: null      },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-black text-[var(--text-primary)]">Dashboard</h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">Live analytics for Midnight Riches</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-28" />)
          : KPI_CARDS.map((c) => <KpiCard key={c.label} {...c} />)
        }
      </div>

      {/* House profit banner */}
      {!loading && kpis && (
        <div
          className="flex items-center justify-between rounded-2xl border px-6 py-4"
          style={{
            background: houseProfit >= 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
            borderColor: houseProfit >= 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Net House Profit</p>
            <p
              className="mt-0.5 text-3xl font-black tabular-nums"
              style={{ color: houseProfit >= 0 ? "#22c55e" : "#ef4444" }}
            >
              {houseProfit >= 0 ? "+" : ""}{fmtCurrency(houseProfit)}
            </p>
          </div>
          {houseProfit >= 0 ? (
            <TrendingUp className="h-10 w-10 text-emerald-400 opacity-30" />
          ) : (
            <TrendingDown className="h-10 w-10 text-red-400 opacity-30" />
          )}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Spins over time */}
        <div
          className="rounded-2xl border border-[var(--glass-border)] p-5"
          style={{ background: "var(--glass-bg)" }}
        >
          <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">Spins & Payouts — Last 14 Days</p>
          {loading ? (
            <Sk className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={spinData.map((d) => ({ ...d, date: fmtDate(d.date) }))}>
                <defs>
                  <linearGradient id="spinsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payoutsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="spins"   name="Spins"   stroke="#7c3aed" fill="url(#spinsGrad)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="payouts" name="$Payouts" stroke="#f59e0b" fill="url(#payoutsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* New users growth */}
        <div
          className="rounded-2xl border border-[var(--glass-border)] p-5"
          style={{ background: "var(--glass-bg)" }}
        >
          <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">New Registrations — Last 30 Days</p>
          {loading ? (
            <Sk className="h-48" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growData.map((d) => ({ ...d, date: fmtDate(d.date) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false}
                  interval={5} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="registrations" name="New Users" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top players + Recent sessions */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top players */}
        <div
          className="rounded-2xl border border-[var(--glass-border)] p-5"
          style={{ background: "var(--glass-bg)" }}
        >
          <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">Top Players by Volume</p>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-10" />)}</div>
          ) : topP.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] opacity-60">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {topP.map((p, i) => {
                const rtp = p.totalWagered > 0 ? (p.totalWon / p.totalWagered) * 100 : 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--glass-border)] px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    <span className="w-5 text-center text-xs font-black text-[var(--text-muted)]">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                        {p.name ?? p.email.split("@")[0]}
                      </p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">{p.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-400">{fmtCurrency(p.totalWagered)}</p>
                      <p className={`text-[10px] font-medium ${rtp >= 100 ? "text-red-400" : "text-emerald-400"}`}>
                        RTP {rtp.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div
          className="rounded-2xl border border-[var(--glass-border)] p-5"
          style={{ background: "var(--glass-bg)" }}
        >
          <p className="mb-4 text-sm font-bold text-[var(--text-primary)]">Recent Sessions</p>
          {loading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-8" />)}</div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] opacity-60">No sessions yet.</p>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {recent.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs"
                  style={{ background: "rgba(255,255,255,0.025)" }}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      s.outcome === "win" ? "bg-emerald-400" : s.outcome === "bonus" ? "bg-amber-400" : "bg-white/20"
                    }`}
                  />
                  <span className="min-w-0 flex-1 truncate text-[var(--text-muted)]">{s.email}</span>
                  <span className="text-[var(--text-muted)]">{fmtCurrency(s.betAmount)}</span>
                  <span
                    className={`w-14 text-right font-bold ${
                      s.winAmount > 0 ? "text-emerald-400" : "text-[var(--text-muted)] opacity-40"
                    }`}
                  >
                    {s.winAmount > 0 ? `+${fmtCurrency(s.winAmount)}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
