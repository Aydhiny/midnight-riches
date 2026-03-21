"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getSecurityEvents } from "@/server/actions/admin";
import { ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";

interface SecurityEventRow {
  id: string;
  userId: string;
  eventType: string;
  severity: string;
  details: unknown;
  createdAt: Date;
}

const SEVERITY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/20"   },
  medium:   { bg: "bg-amber-500/10",  text: "text-amber-400",  border: "border-amber-500/20"  },
  high:     { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  critical: { bg: "bg-red-500/10",    text: "text-red-400",    border: "border-red-500/20"    },
};

export default function AdminSecurityPage() {
  const t = useTranslations("admin");
  const [events, setEvents] = useState<SecurityEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    const result = await getSecurityEvents({ page, limit: 50 });
    if (result.success) {
      setEvents(result.data.events.map((e) => ({ ...e, createdAt: new Date(e.createdAt) })));
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--text-primary)]">
        {t("securityPage.title")}
      </h2>

      <div
        className="overflow-hidden rounded-2xl border border-[var(--glass-border)]"
        style={{ background: "var(--bg-card)" }}
      >
        <div className="border-b border-[var(--glass-border)] px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {total} {t("securityPage.eventsTotal")}
          </p>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <ShieldAlert className="h-12 w-12 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">{t("securityPage.noEvents")}</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--glass-border)]">
            {events.map((e) => {
              const style = SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.low;
              return (
                <div key={e.id} className="px-5 py-4 transition-colors hover:bg-[var(--bg-card-hover)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${style.bg} ${style.text} ${style.border}`}
                      >
                        {e.severity}
                      </span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {e.eventType}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">
                      {e.createdAt.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {t("securityPage.userId")}: <span className="font-mono">{e.userId}</span>
                  </p>
                  {e.details != null && (
                    <pre
                      className="mt-2 max-h-24 overflow-auto rounded-lg p-2.5 text-xs text-[var(--text-secondary)]"
                      style={{ background: "var(--glass-bg)" }}
                    >
                      {JSON.stringify(e.details as Record<string, unknown>, null, 2)}
                    </pre>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-t border-[var(--glass-border)] px-5 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-[var(--text-muted)]">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
