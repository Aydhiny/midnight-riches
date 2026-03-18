"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHistoryAction } from "@/server/actions/history";
import { getStatsAction, getRtpHistoryAction } from "@/server/actions/stats";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { GameStats } from "@/server/queries/stats";
import Papa from "papaparse";

interface GameSession {
  id: string;
  gameId: string;
  betAmount: string;
  outcome: string;
  winAmount: string;
  reelResult: unknown;
  createdAt: Date;
}

type OutcomeFilter = "all" | "win" | "loss" | "bonus";

interface RtpPoint {
  session: number;
  rtp: number;
  bet: number;
  win: number;
}

function StatsCards({ stats }: { stats: GameStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xs text-purple-400">Total Spins</div>
          <div className="text-lg font-bold text-white">{stats.totalSpins}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xs text-purple-400">Total Wagered</div>
          <div className="text-lg font-bold text-white">{formatCurrency(stats.totalWagered)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xs text-purple-400">Total Won</div>
          <div className="text-lg font-bold text-emerald-400">{formatCurrency(stats.totalWon)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xs text-purple-400">RTP</div>
          <div className="text-lg font-bold text-yellow-400">{stats.rtp.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xs text-purple-400">Biggest Win</div>
          <div className="text-lg font-bold text-pink-400">{formatCurrency(stats.biggestWin)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

function RtpChart({ data }: { data: RtpPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [metric, setMetric] = useState<"rtp" | "win" | "bet">("rtp");

  if (data.length === 0) return null;

  const W = 640, H = 240, PL = 52, PR = 24, PT = 20, PB = 36;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const values = data.map((d) => metric === "rtp" ? d.rtp : metric === "win" ? d.win : d.bet);
  const maxV = Math.max(...values, metric === "rtp" ? 100 : 0) * 1.08;
  const minV = Math.min(...values, metric === "rtp" ? 0 : 0);
  const range = maxV - minV || 1;

  const toX = (i: number) => PL + (i / Math.max(data.length - 1, 1)) * chartW;
  const toY = (v: number) => PT + chartH - ((v - minV) / range) * chartH;

  const linePath = data.map((d, i) => {
    const v = metric === "rtp" ? d.rtp : metric === "win" ? d.win : d.bet;
    return `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`;
  }).join(" ");

  const areaPath = [
    ...data.map((d, i) => {
      const v = metric === "rtp" ? d.rtp : metric === "win" ? d.win : d.bet;
      return `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`;
    }),
    `L ${toX(data.length - 1).toFixed(1)} ${PT + chartH}`,
    `L ${toX(0).toFixed(1)} ${PT + chartH}`,
    "Z",
  ].join(" ");

  // Y-axis gridlines (5 ticks)
  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => minV + (i / ticks) * range);

  const hoveredPoint = hovered !== null ? data[hovered] : null;
  const hoveredX = hovered !== null ? toX(hovered) : 0;
  const hoveredV = hovered !== null ? values[hovered] : 0;
  const hoveredY = hovered !== null ? toY(hoveredV) : 0;

  const METRIC_COLOR: Record<string, string> = { rtp: "#fbbf24", win: "#34d399", bet: "#a78bfa" };
  const stroke = METRIC_COLOR[metric];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold text-[var(--text-primary)]">
            Performance over last {data.length} sessions
          </CardTitle>
          <div className="flex gap-1.5">
            {(["rtp", "win", "bet"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-lg px-3 py-1 text-[11px] font-bold transition-all ${
                  metric === m
                    ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {m === "rtp" ? "RTP %" : m === "win" ? "Win $" : "Bet $"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative p-4 pt-0">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full cursor-crosshair"
          onMouseLeave={() => setHovered(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const svgX = ((e.clientX - rect.left) / rect.width) * W;
            const relX = svgX - PL;
            const idx = Math.round((relX / chartW) * (data.length - 1));
            setHovered(Math.max(0, Math.min(data.length - 1, idx)));
          }}
        >
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
              <stop offset="100%" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
              <stop offset="50%" stopColor={stroke} />
              <stop offset="100%" stopColor={stroke} stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Y-axis grid + labels */}
          {yTicks.map((v, i) => {
            const y = toY(v);
            const label = metric === "rtp" ? `${v.toFixed(0)}%` : `$${v.toFixed(0)}`;
            return (
              <g key={i}>
                <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={PL - 6} y={y} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end" dominantBaseline="middle">
                  {label}
                </text>
              </g>
            );
          })}

          {/* RTP 96% target line */}
          {metric === "rtp" && (() => {
            const ty = toY(96);
            return (
              <g>
                <line x1={PL} y1={ty} x2={W - PR} y2={ty} stroke="#7c3aed" strokeDasharray="5 3" strokeWidth="1" opacity="0.7" />
                <text x={W - PR + 3} y={ty} fill="#9333ea" fontSize="9" dominantBaseline="middle">96%</text>
              </g>
            );
          })()}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* X-axis session markers */}
          {data.map((_, i) => {
            if (data.length > 20 && i % Math.ceil(data.length / 10) !== 0) return null;
            return (
              <text key={i} x={toX(i)} y={H - PB + 14} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="middle">
                {i + 1}
              </text>
            );
          })}

          {/* Hover crosshair */}
          {hovered !== null && (
            <>
              <line x1={hoveredX} y1={PT} x2={hoveredX} y2={PT + chartH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx={hoveredX} cy={hoveredY} r={5} fill={stroke} stroke="#0f0520" strokeWidth="2" />
              {/* Tooltip */}
              {hoveredPoint && (() => {
                const tipW = 130, tipH = 60;
                const tipX = Math.min(hoveredX + 12, W - tipW - 4);
                const tipY = Math.max(hoveredY - tipH / 2, PT);
                const dispV = metric === "rtp" ? `${hoveredV.toFixed(1)}%` : `$${hoveredV.toFixed(2)}`;
                return (
                  <g>
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx="6" fill="#0d0020" stroke={stroke} strokeWidth="0.8" opacity="0.95" />
                    <text x={tipX + 10} y={tipY + 16} fill="rgba(255,255,255,0.5)" fontSize="10">Session {hovered! + 1}</text>
                    <text x={tipX + 10} y={tipY + 34} fill={stroke} fontSize="14" fontWeight="bold">{dispV}</text>
                    <text x={tipX + 10} y={tipY + 50} fill="rgba(255,255,255,0.35)" fontSize="9">
                      Bet: ${hoveredPoint.bet.toFixed(2)} · Win: ${hoveredPoint.win.toFixed(2)}
                    </text>
                  </g>
                );
              })()}
            </>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-1 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-6 rounded-full" style={{ background: stroke }} />
            <span>{metric === "rtp" ? "RTP %" : metric === "win" ? "Win amount" : "Bet amount"}</span>
          </div>
          {metric === "rtp" && (
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-6 rounded-full bg-violet-500 opacity-60" style={{ backgroundImage: "repeating-linear-gradient(90deg, #7c3aed 0 5px, transparent 5px 8px)" }} />
              <span>Target RTP (96%)</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const t = useTranslations("history");
  const [items, setItems] = useState<GameSession[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<OutcomeFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<GameStats | null>(null);
  const [rtpData, setRtpData] = useState<RtpPoint[]>([]);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    const result = await getHistoryAction({
      page,
      limit: 20,
      outcome: filter === "all" ? undefined : filter,
    });

    if (result.success && "items" in result) {
      setItems(result.items as unknown as GameSession[]);
      setTotalPages(result.totalPages);
    }
    setIsLoading(false);
  }, [page, filter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    getStatsAction().then((result) => {
      if (result.success && "stats" in result) {
        setStats(result.stats);
      }
    });
    getRtpHistoryAction().then((result) => {
      if (result.success && "data" in result) {
        setRtpData(result.data);
      }
    });
  }, []);

  const exportCsv = useCallback(() => {
    const csvData = items.map((item) => ({
      Date: formatDate(item.createdAt),
      Game: item.gameId ?? "fruit-slots",
      Bet: Number(item.betAmount).toFixed(2),
      Outcome: item.outcome,
      Win: Number(item.winAmount).toFixed(2),
      Net: (Number(item.winAmount) - Number(item.betAmount)).toFixed(2),
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "midnight-riches-history.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [items]);

  const filters: { value: OutcomeFilter; label: string }[] = [
    { value: "all", label: t("all") },
    { value: "win", label: t("wins") },
    { value: "loss", label: t("losses") },
    { value: "bonus", label: t("bonuses") },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      {stats && <StatsCards stats={stats} />}
      {rtpData.length > 0 && <RtpChart data={rtpData} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("title")}</CardTitle>
            <div className="flex gap-2">
              {filters.map((f) => (
                <Button
                  key={f.value}
                  variant={filter === f.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setFilter(f.value);
                    setPage(1);
                  }}
                >
                  {f.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={items.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-purple-400">Loading...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-purple-400">{t("noHistory")}</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-purple-500/20 text-purple-400">
                      <th className="pb-3 font-medium">{t("date")}</th>
                      <th className="pb-3 font-medium">Game</th>
                      <th className="pb-3 font-medium">{t("bet")}</th>
                      <th className="pb-3 font-medium">{t("outcome")}</th>
                      <th className="pb-3 text-right font-medium">{t("winAmount")}</th>
                      <th className="pb-3 text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const net = Number(item.winAmount) - Number(item.betAmount);
                      return (
                        <tr key={item.id} className="border-b border-purple-500/10">
                          <td className="py-3 text-purple-200">{formatDate(item.createdAt)}</td>
                          <td className="py-3 text-purple-300 text-xs">{item.gameId ?? "classic"}</td>
                          <td className="py-3 text-white">{formatCurrency(Number(item.betAmount))}</td>
                          <td className="py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                item.outcome === "win"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : item.outcome === "bonus"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {item.outcome}
                            </span>
                          </td>
                          <td className="py-3 text-right font-medium text-emerald-400">
                            {Number(item.winAmount) > 0 ? formatCurrency(Number(item.winAmount)) : "-"}
                          </td>
                          <td className={`py-3 text-right font-medium ${net >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {net >= 0 ? "+" : ""}{formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-purple-400">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
