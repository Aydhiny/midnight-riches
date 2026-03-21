"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdminUsers, adminAdjustBalance, adminSetUserRole } from "@/server/actions/admin";
import { Search, ChevronLeft, ChevronRight, DollarSign, Shield } from "lucide-react";
import type { AdminUserRow } from "@/types";

function fmtCurrency(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.05] ${className}`} />;
}

export default function AdminUsersPage() {
  const [users,       setUsers]       = useState<AdminUserRow[]>([]);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState("");
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [adjustId,    setAdjustId]    = useState<string | null>(null);
  const [adjustAmt,   setAdjustAmt]   = useState("");
  const [adjustNote,  setAdjustNote]  = useState("");
  const [adjusting,   setAdjusting]   = useState(false);
  const [toast,       setToast]       = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getAdminUsers({ query: search || undefined, page, limit: 20 });
    if (r.success) { setUsers(r.data.users); setTotal(r.data.total); }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function handleAdjust() {
    if (!adjustId || !adjustAmt || !adjustNote) return;
    const amount = parseFloat(adjustAmt);
    if (isNaN(amount)) return;
    setAdjusting(true);
    const r = await adminAdjustBalance({ userId: adjustId, amount, reason: adjustNote });
    if (r.success) {
      showToast(`Balance adjusted by ${fmtCurrency(amount)}`);
      setAdjustId(null); setAdjustAmt(""); setAdjustNote("");
      load();
    } else {
      showToast("Failed: " + (r.error ?? "unknown error"));
    }
    setAdjusting(false);
  }

  async function handleRoleToggle(userId: string, currentRole: "user" | "admin") {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const r = await adminSetUserRole(userId, newRole);
    if (r.success) {
      showToast(`Role updated to ${newRole}`);
      load();
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">Users</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{total.toLocaleString()} total accounts</p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email…"
            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl border border-[var(--glass-border)]"
        style={{ background: "var(--glass-bg)" }}
      >
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Sk key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  {["Email", "Name", "Role", "Balance", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[var(--glass-border)] border-opacity-40 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{u.email}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{u.name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          u.role === "admin"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-white/[0.05] text-[var(--text-muted)]"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black tabular-nums text-amber-400">
                      {fmtCurrency(u.balance)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAdjustId(adjustId === u.id ? null : u.id)}
                          className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500/15 transition-colors"
                          title="Adjust balance"
                        >
                          <DollarSign className="h-3 w-3" />
                          Adjust
                        </button>
                        <button
                          onClick={() => handleRoleToggle(u.id, u.role)}
                          className="flex items-center gap-1 rounded-lg border border-violet-500/20 bg-violet-500/8 px-2 py-1 text-[10px] font-bold text-violet-400 hover:bg-violet-500/15 transition-colors"
                          title="Toggle admin role"
                        >
                          <Shield className="h-3 w-3" />
                          Role
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[var(--text-muted)] opacity-50">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] disabled:opacity-30 hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] disabled:opacity-30 hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Balance adjust panel */}
      {adjustId && (
        <div
          className="rounded-2xl border border-amber-500/25 p-5"
          style={{ background: "rgba(245,158,11,0.06)" }}
        >
          <p className="mb-3 text-sm font-bold text-amber-400">
            Adjust Balance — {users.find((u) => u.id === adjustId)?.email}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              placeholder="Amount (+/-)"
              value={adjustAmt}
              onChange={(e) => setAdjustAmt(e.target.value)}
              className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/8 px-3 py-2 text-sm text-amber-300 placeholder:text-amber-400/40 outline-none"
            />
            <input
              placeholder="Reason"
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              onClick={handleAdjust}
              disabled={adjusting}
              className="rounded-xl bg-amber-500 px-5 py-2 text-sm font-black text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {adjusting ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => { setAdjustId(null); setAdjustAmt(""); setAdjustNote(""); }}
              className="rounded-xl border border-[var(--glass-border)] px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-amber-500/30 bg-[rgba(8,2,22,0.95)] px-5 py-3 text-sm font-semibold text-amber-300 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
