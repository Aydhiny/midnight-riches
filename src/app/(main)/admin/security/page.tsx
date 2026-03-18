"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSecurityEvents } from "@/server/actions/admin";

interface SecurityEventRow {
  id: string;
  userId: string;
  eventType: string;
  severity: string;
  details: unknown;
  createdAt: Date;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-blue-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  critical: "text-red-400",
};

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const result = await getSecurityEvents({ page, limit: 50 });
    if (result.success) {
      setEvents(
        result.data.events.map((e) => ({
          ...e,
          createdAt: new Date(e.createdAt),
        }))
      );
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Security Center</h2>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-purple-400">
            No security events recorded
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-purple-400">
              {total} events total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-purple-800/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold uppercase ${
                          SEVERITY_COLORS[e.severity] || "text-gray-400"
                        }`}
                      >
                        {e.severity}
                      </span>
                      <span className="text-sm font-medium">
                        {e.eventType}
                      </span>
                    </div>
                    <span className="text-xs text-purple-400">
                      {e.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-purple-300">
                    User: {e.userId}
                  </div>
                  <pre className="mt-2 max-h-24 overflow-auto rounded bg-black/30 p-2 text-xs text-purple-200">
                    {JSON.stringify(e.details, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <span className="text-sm text-purple-300">
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
