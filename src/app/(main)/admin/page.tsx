"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminKPIs } from "@/server/actions/admin";
import { formatCurrency } from "@/lib/utils";
import type { AdminKPIs } from "@/types";

function KPICard({
  title,
  value,
  format = "number",
}: {
  title: string;
  value: number;
  format?: "number" | "currency" | "percent";
}) {
  let display: string;
  switch (format) {
    case "currency":
      display = formatCurrency(value);
      break;
    case "percent":
      display = `${value.toFixed(2)}%`;
      break;
    default:
      display = value.toLocaleString();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-purple-400">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-yellow-400">{display}</div>
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const [kpis, setKPIs] = useState<AdminKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const result = await getAdminKPIs();
      if (result.success) {
        setKPIs(result.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
      </div>
    );
  }

  if (!kpis) {
    return <p className="text-red-400">Failed to load KPIs</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Overview</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KPICard title="Total Users" value={kpis.totalUsers} />
        <KPICard title="Active Today" value={kpis.activeUsersToday} />
        <KPICard
          title="Total Revenue"
          value={kpis.totalRevenue}
          format="currency"
        />
        <KPICard
          title="Total Payouts"
          value={kpis.totalPayouts}
          format="currency"
        />
        <KPICard
          title="House Edge"
          value={kpis.houseEdge}
          format="percent"
        />
        <KPICard
          title="Active Jackpot"
          value={kpis.activeJackpot}
          format="currency"
        />
      </div>
    </div>
  );
}
