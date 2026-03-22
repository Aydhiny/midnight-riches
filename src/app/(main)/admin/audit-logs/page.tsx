"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { getAdminAuditLogs } from "@/server/actions/admin";
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface AuditLogRow {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string | null;
  action: string;
  targetUserId: string | null;
  targetEmail: string | null;
  details: unknown;
  createdAt: Date;
}

// ── Action colour mapping ─────────────────────────────────────────────────────

const ACTION_STYLE: Record<string, { bg: string; text: string; border: string; icon: React.ElementType }> = {
  adjust_balance: {
    bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20",
    icon: DollarSign,
  },
  set_user_role: {
    bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20",
    icon: User,
  },
};

function getActionStyle(action: string) {
  return ACTION_STYLE[action] ?? {
    bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20",
    icon: Settings,
  };
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Details renderer ─────────────────────────────────────────────────────────

function DetailsRow({ details }: { details: unknown }) {
  const [open, setOpen] = useState(false);
  if (details == null) return null;

  const entries = Object.entries(details as Record<string, unknown>);
  if (entries.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        Details
      </button>

      {open && (
        <div
          className="mt-1.5 flex flex-wrap gap-2 rounded-lg p-2.5"
          style={{ background: "var(--glass-bg)" }}
        >
          {entries.map(([key, val]) => (
            <span
              key={key}
              className="flex items-center gap-1 rounded border border-[var(--glass-border)] px-2 py-0.5 text-[11px]"
              style={{ background: "var(--bg-card)" }}
            >
              <span className="font-medium text-[var(--text-muted)]">{key}:</span>
              <span className="font-mono text-[var(--text-primary)]">
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default function AdminAuditLogsPage() {
  const t = useTranslations("admin.auditPage");

  const [logs, setLogs]           = useState<AuditLogRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [actions, setActions]     = useState<string[]>([]);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState<string>("");
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    const result = await getAdminAuditLogs({
      page,
      limit: PAGE_SIZE,
      action: filter || undefined,
    });

    if (result.success) {
      setLogs(result.data.logs.map((l) => ({ ...l, createdAt: new Date(l.createdAt) })));
      setTotal(result.data.total);
      setActions(result.data.actions);
    }

    setLoading(false);
    setRefreshing(false);
  }, [page, filter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  // Reset to page 1 when filter changes
  const handleFilter = (a: string) => { setFilter(a); setPage(1); };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => loadLogs(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 self-start rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Action filter chips */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilter("")}
            className={[
              "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
              filter === ""
                ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-violet-500/30 hover:text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {t("filterAll")}
          </button>
          {actions.map((a) => {
            const style = getActionStyle(a);
            const active = filter === a;
            return (
              <button
                key={a}
                onClick={() => handleFilter(a)}
                className={[
                  "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
                  active
                    ? `${style.bg} ${style.text} ${style.border}`
                    : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-violet-500/30 hover:text-[var(--text-secondary)]",
                ].join(" ")}
              >
                {formatAction(a)}
              </button>
            );
          })}
        </div>
      )}

      {/* Table card */}
      <div
        className="overflow-hidden rounded-2xl border border-[var(--glass-border)]"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {total} {t("logsTotal")}
          </p>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <ClipboardList className="h-12 w-12 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">{t("noLogs")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    <th className="px-5 py-2.5 text-left">{t("colAction")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colAdmin")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colTarget")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colDetails")}</th>
                    <th className="px-5 py-2.5 text-right">{t("colTime")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {logs.map((log) => {
                    const style = getActionStyle(log.action);
                    const ActionIcon = style.icon;
                    return (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-[var(--bg-card-hover)]"
                      >
                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}
                          >
                            <ActionIcon className="h-3 w-3 shrink-0" />
                            {formatAction(log.action)}
                          </span>
                        </td>

                        {/* Admin */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-[var(--text-primary)]">
                            {log.adminName ?? log.adminEmail}
                          </div>
                          {log.adminName && (
                            <div className="text-[11px] text-[var(--text-muted)]">{log.adminEmail}</div>
                          )}
                        </td>

                        {/* Target */}
                        <td className="px-5 py-3.5">
                          {log.targetEmail ? (
                            <span className="text-xs text-[var(--text-secondary)]">{log.targetEmail}</span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">{t("noTarget")}</span>
                          )}
                        </td>

                        {/* Details */}
                        <td className="px-5 py-3.5 max-w-xs">
                          {log.details != null ? (
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(log.details as Record<string, unknown>).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="rounded border border-[var(--glass-border)] px-1.5 py-0.5 text-[11px]"
                                  style={{ background: "var(--glass-bg)" }}
                                >
                                  <span className="text-[var(--text-muted)]">{k}: </span>
                                  <span className="font-mono text-[var(--text-secondary)]">
                                    {typeof v === "object" ? JSON.stringify(v) : String(v)}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)] italic">{t("noDetails")}</span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-5 py-3.5 text-right">
                          <span className="whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                            {log.createdAt.toLocaleDateString(undefined, {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                            <br />
                            {log.createdAt.toLocaleTimeString(undefined, {
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[var(--glass-border)] md:hidden">
              {logs.map((log) => {
                const style = getActionStyle(log.action);
                const ActionIcon = style.icon;
                return (
                  <div key={log.id} className="px-4 py-4 transition-colors hover:bg-[var(--bg-card-hover)]">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}
                      >
                        <ActionIcon className="h-3 w-3 shrink-0" />
                        {formatAction(log.action)}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {log.createdAt.toLocaleString()}
                      </span>
                    </div>

                    <div className="mt-2.5 space-y-0.5">
                      <p className="text-xs text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-secondary)]">{t("colAdmin")}:</span>{" "}
                        {log.adminName ?? log.adminEmail}
                      </p>
                      {log.targetEmail && (
                        <p className="text-xs text-[var(--text-muted)]">
                          <span className="font-medium text-[var(--text-secondary)]">{t("colTarget")}:</span>{" "}
                          {log.targetEmail}
                        </p>
                      )}
                    </div>

                    <DetailsRow details={log.details} />
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--glass-border)] px-5 py-3">
            <span className="text-xs text-[var(--text-muted)]">
              {t("page")} {page} {t("of")} {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
