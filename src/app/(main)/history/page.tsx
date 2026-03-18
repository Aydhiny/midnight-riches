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
  if (data.length === 0) return null;

  const maxRtp = Math.max(...data.map((d) => d.rtp), 100);
  const minRtp = Math.min(...data.map((d) => d.rtp), 0);
  const range = maxRtp - minRtp || 1;
  const width = 600;
  const height = 200;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d.rtp - minRtp) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">RTP Over Last {data.length} Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <line
            x1={padding} y1={height - padding - ((96 - minRtp) / range) * (height - padding * 2)}
            x2={width - padding} y2={height - padding - ((96 - minRtp) / range) * (height - padding * 2)}
            stroke="#6b21a8" strokeDasharray="4" strokeWidth="1"
          />
          <text
            x={width - padding + 5}
            y={height - padding - ((96 - minRtp) / range) * (height - padding * 2)}
            fill="#9333ea" fontSize="10" dominantBaseline="middle"
          >
            96%
          </text>
          <polyline
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            points={points}
          />
          <text x={padding} y={height - 5} fill="#9333ea" fontSize="10">1</text>
          <text x={width - padding} y={height - 5} fill="#9333ea" fontSize="10" textAnchor="end">
            {data.length}
          </text>
        </svg>
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
