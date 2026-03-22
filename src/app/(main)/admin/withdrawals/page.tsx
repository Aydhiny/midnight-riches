"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  adminGetWithdrawalsAction,
  adminApproveWithdrawalAction,
  adminRejectWithdrawalAction,
  type AdminWithdrawalRow,
} from "@/server/actions/withdrawal";
import {
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:    { bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/20",   icon: Clock       },
  processing: { bg: "bg-blue-500/10",    text: "text-blue-400",    border: "border-blue-500/20",    icon: RefreshCw   },
  approved:   { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", icon: CheckCircle },
  rejected:   { bg: "bg-red-500/10",     text: "text-red-400",     border: "border-red-500/20",     icon: XCircle     },
} as const;

type Status = keyof typeof STATUS_STYLE;

// ── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  title,
  body,
  notesPlaceholder,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  notesPlaceholder: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}) {
  const [notes, setNotes] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--glass-border)] p-6 shadow-2xl"
        style={{ background: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="mb-4 text-sm text-[var(--text-muted)]">{body}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={notesPlaceholder}
          rows={2}
          className="mb-4 w-full resize-none rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/50 focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;
type FilterStatus = "all" | "pending" | "approved" | "rejected" | "processing";

export default function AdminWithdrawalsPage() {
  const t = useTranslations("admin.withdrawalsPage");

  const [rows, setRows]         = useState<AdminWithdrawalRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [filter, setFilter]     = useState<FilterStatus>("pending");
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Action state
  const [actionRow, setActionRow] = useState<{ row: AdminWithdrawalRow; type: "approve" | "reject" } | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const loadRows = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const res = await adminGetWithdrawalsAction({
      status: filter === "all" ? "all" : filter,
      page,
      limit: PAGE_SIZE,
    });
    if (res.success) {
      setRows(res.data.withdrawals);
      setTotal(res.data.total);
    }
    setLoading(false);
    setRefreshing(false);
  }, [filter, page]);

  useEffect(() => { loadRows(); }, [loadRows]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all",        label: t("filterAll")        },
    { key: "pending",    label: t("filterPending")    },
    { key: "processing", label: t("filterProcessing") },
    { key: "approved",   label: t("filterApproved")   },
    { key: "rejected",   label: t("filterRejected")   },
  ];

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  function fmtTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  async function handleConfirm(notes: string) {
    if (!actionRow) return;
    const { row, type } = actionRow;
    setActioning(row.id);
    setActionRow(null);

    if (type === "approve") {
      await adminApproveWithdrawalAction(row.id, notes || undefined);
    } else {
      await adminRejectWithdrawalAction(row.id, notes || undefined);
    }

    setActioning(null);
    await loadRows(true);
  }

  return (
    <div className="space-y-5">
      {/* Confirm modal */}
      {actionRow && (
        <ConfirmModal
          title={actionRow.type === "approve" ? t("approve") : t("reject")}
          body={
            actionRow.type === "approve"
              ? t("approveConfirm", { amount: actionRow.row.amount.toFixed(2), email: actionRow.row.userEmail })
              : t("rejectConfirm", { amount: actionRow.row.amount.toFixed(2), email: actionRow.row.userEmail })
          }
          notesPlaceholder={t("notesPlaceholder")}
          confirmLabel={actionRow.type === "approve" ? t("approve") : t("reject")}
          confirmClass={
            actionRow.type === "approve"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }
          onConfirm={handleConfirm}
          onCancel={() => setActionRow(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t("title")}</h2>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => loadRows(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 self-start rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setPage(1); }}
            className={[
              "rounded-full border px-3 py-1 text-[11px] font-semibold transition-all",
              filter === f.key
                ? "border-violet-500/50 bg-violet-500/15 text-violet-300"
                : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-violet-500/30 hover:text-[var(--text-secondary)]",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table card */}
      <div
        className="overflow-hidden rounded-2xl border border-[var(--glass-border)]"
        style={{ background: "var(--bg-card)" }}
      >
        {/* Card header bar */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {total} {t("totalRequests")}
          </p>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20">
            <ArrowUpFromLine className="h-12 w-12 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">{t("noRequests")}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--glass-border)] text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    <th className="px-5 py-2.5 text-left">{t("colPlayer")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colAmount")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colStatus")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colRequested")}</th>
                    <th className="px-5 py-2.5 text-left">{t("colProcessed")}</th>
                    <th className="px-5 py-2.5 text-right">{t("colActions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--glass-border)]">
                  {rows.map((row) => {
                    const style = STATUS_STYLE[row.status as Status] ?? STATUS_STYLE.pending;
                    const Icon = style.icon;
                    const canAct = row.status === "pending" || row.status === "processing";
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-[var(--bg-card-hover)]">
                        {/* Player */}
                        <td className="px-5 py-3.5">
                          <div className="text-xs font-medium text-[var(--text-primary)]">
                            {row.userName ?? row.userEmail}
                          </div>
                          {row.userName && (
                            <div className="text-[11px] text-[var(--text-muted)]">{row.userEmail}</div>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-bold text-[var(--text-primary)]">
                            ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            {t(`status${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}` as Parameters<typeof t>[0])}
                          </span>
                          {row.notes && (
                            <p className="mt-1 text-[11px] text-[var(--text-muted)] italic">{row.notes}</p>
                          )}
                        </td>

                        {/* Requested */}
                        <td className="px-5 py-3.5 text-[11px] text-[var(--text-muted)]">
                          {fmtDate(row.requestedAt)}<br />
                          {fmtTime(row.requestedAt)}
                        </td>

                        {/* Processed */}
                        <td className="px-5 py-3.5 text-[11px] text-[var(--text-muted)]">
                          {row.processedAt ? (
                            <>{fmtDate(row.processedAt)}<br />{fmtTime(row.processedAt)}</>
                          ) : (
                            <span className="italic">{t("noNotes")}</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          {canAct && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setActionRow({ row, type: "approve" })}
                                disabled={actioning === row.id}
                                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {actioning === row.id ? t("approving") : t("approve")}
                              </button>
                              <button
                                onClick={() => setActionRow({ row, type: "reject" })}
                                disabled={actioning === row.id}
                                className="flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                              >
                                <XCircle className="h-3 w-3" />
                                {actioning === row.id ? t("rejecting") : t("reject")}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-[var(--glass-border)] md:hidden">
              {rows.map((row) => {
                const style = STATUS_STYLE[row.status as Status] ?? STATUS_STYLE.pending;
                const Icon = style.icon;
                const canAct = row.status === "pending" || row.status === "processing";
                return (
                  <div key={row.id} className="px-4 py-4 transition-colors hover:bg-[var(--bg-card-hover)]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {row.userName ?? row.userEmail}
                        </p>
                        {row.userName && (
                          <p className="text-[11px] text-[var(--text-muted)]">{row.userEmail}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        {t(`status${row.status.charAt(0).toUpperCase()}${row.status.slice(1)}` as Parameters<typeof t>[0])}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-[var(--text-primary)]">
                        ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        {fmtDate(row.requestedAt)}
                      </span>
                    </div>

                    {row.notes && (
                      <p className="mt-1 text-[11px] text-[var(--text-muted)] italic">{row.notes}</p>
                    )}

                    {canAct && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => setActionRow({ row, type: "approve" })}
                          disabled={actioning === row.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("approve")}
                        </button>
                        <button
                          onClick={() => setActionRow({ row, type: "reject" })}
                          disabled={actioning === row.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t("reject")}
                        </button>
                      </div>
                    )}
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
