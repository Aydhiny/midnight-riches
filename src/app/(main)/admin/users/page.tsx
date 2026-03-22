"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { getAdminUsers, adminAdjustBalance, adminSetUserRole } from "@/server/actions/admin";
import { Search, ChevronLeft, ChevronRight, DollarSign, Shield, X, AlertTriangle } from "lucide-react";
import type { AdminUserRow } from "@/types";

function fmtBalance(v: number) {
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " cr";
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--glass-border)] ${className}`} />;
}

// ── Modal backdrop ──────────────────────────────────────────────────────────
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.18 }}
          className="w-full max-w-md rounded-2xl border border-[var(--glass-border)] p-6 shadow-2xl"
          style={{ background: "var(--bg-card)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Balance modal ───────────────────────────────────────────────────────────
function BalanceModal({
  user,
  onClose,
  onSuccess,
}: {
  user: AdminUserRow;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const t = useTranslations("admin.usersPage");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || !reason.trim()) return;
    setBusy(true);
    setErr("");
    const r = await adminAdjustBalance({ userId: user.id, amount: amt, reason: reason.trim() });
    if (r.success) {
      onSuccess(`${t("balanceAdjusted")} ${amt > 0 ? "+" : ""}${amt.toFixed(2)} cr`);
      onClose();
    } else {
      setErr(r.error ?? t("errorUnknown"));
    }
    setBusy(false);
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">{t("balanceModalTitle")}</h2>
            <p className="text-[11px] text-[var(--text-muted)] font-mono">{user.email}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)]">{t("amountLabel")}</label>
          <input
            type="number"
            placeholder={t("amountPlaceholder")}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-amber-500/40"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-muted)]">{t("reasonLabel")}</label>
          <input
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-amber-500/40"
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-[var(--glass-border)] py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          onClick={submit}
          disabled={busy || !amount || !reason.trim()}
          className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-black text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {busy ? "…" : t("confirm")}
        </button>
      </div>
    </Modal>
  );
}

// ── Role modal ──────────────────────────────────────────────────────────────
function RoleModal({
  user,
  isSelf,
  onClose,
  onSuccess,
}: {
  user: AdminUserRow;
  isSelf: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const t = useTranslations("admin.usersPage");
  const newRole = user.role === "admin" ? "user" : "admin";
  const isDemoting = user.role === "admin";
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (isSelf) return;
    setBusy(true);
    setErr("");
    const r = await adminSetUserRole(user.id, newRole);
    if (r.success) {
      onSuccess(t("roleUpdated", { role: newRole }));
      onClose();
    } else {
      setErr(r.error ?? t("errorUnknown"));
    }
    setBusy(false);
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isDemoting ? "bg-red-500/15 border-red-500/30" : "bg-violet-500/15 border-violet-500/30"}`}>
            <Shield className={`h-4 w-4 ${isDemoting ? "text-red-400" : "text-violet-400"}`} />
          </div>
          <h2 className="text-base font-black text-[var(--text-primary)]">{t("roleModalTitle")}</h2>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg)] transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {isSelf ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">{t("selfDemoteError")}</p>
          </div>
        </div>
      ) : (
        <div className={`rounded-xl border p-4 ${isDemoting ? "border-red-500/30 bg-red-500/10" : "border-violet-500/30 bg-violet-500/10"}`}>
          <div className={`flex items-start gap-2 ${isDemoting ? "text-red-300" : "text-violet-300"}`}>
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{isDemoting ? t("roleModalWarnDemote") : t("roleModalWarnPromote")}</p>
              <p className="mt-1 font-mono text-[11px] opacity-80">{user.email}</p>
              <p className="mt-2 text-xs opacity-70">{isDemoting ? t("roleModalConfirmDemote") : t("roleModalConfirmPromote")}</p>
            </div>
          </div>
        </div>
      )}

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl border border-[var(--glass-border)] py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          {t("cancel")}
        </button>
        {!isSelf && (
          <button
            onClick={submit}
            disabled={busy}
            className={`flex-1 rounded-xl py-2 text-sm font-black text-white disabled:opacity-50 transition-colors ${
              isDemoting ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"
            }`}
          >
            {busy ? "…" : isDemoting ? t("removeAdmin") : t("makeAdmin")}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const t = useTranslations("admin.usersPage");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [balanceTarget, setBalanceTarget] = useState<AdminUserRow | null>(null);
  const [roleTarget, setRoleTarget] = useState<AdminUserRow | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAdminUsers({ query: search || undefined, page, limit: 20 });
      if (r.success) { setUsers(r.data.users); setTotal(r.data.total); }
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[var(--text-primary)]">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{total.toLocaleString()} {t("totalAccounts")}</p>
        </div>
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-500/40"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--glass-border)]" style={{ background: "var(--glass-bg)" }}>
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Sk key={i} className="h-12" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  {[t("email"), t("name"), t("role"), t("balance"), t("joined"), t("actions")].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-[var(--glass-border)] border-opacity-40 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1.5">
                          {u.email}
                          {isSelf && (
                            <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-400">
                              {t("you")}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{u.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                          u.role === "admin"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-white/[0.05] text-[var(--text-muted)]"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black tabular-nums text-amber-400">
                        {fmtBalance(u.balance)}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setBalanceTarget(u)}
                            className="flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/8 px-2 py-1 text-[10px] font-bold text-amber-400 hover:bg-amber-500/15 transition-colors"
                            title={t("adjustBalance")}
                          >
                            <DollarSign className="h-3 w-3" />
                            {t("adjust")}
                          </button>
                          <button
                            onClick={() => setRoleTarget(u)}
                            disabled={isSelf}
                            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors ${
                              isSelf
                                ? "cursor-not-allowed border-[var(--glass-border)] text-[var(--text-muted)] opacity-40"
                                : u.role === "admin"
                                ? "border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15"
                                : "border-violet-500/20 bg-violet-500/8 text-violet-400 hover:bg-violet-500/15"
                            }`}
                            title={isSelf ? t("selfDemoteError") : t("toggleRole")}
                          >
                            <Shield className="h-3 w-3" />
                            {t("role")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-[var(--text-muted)] opacity-50">
                      {t("noUsers")}
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
            {t("page")} {page} {t("of")} {totalPages}
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

      {/* Modals */}
      {balanceTarget && (
        <BalanceModal
          user={balanceTarget}
          onClose={() => setBalanceTarget(null)}
          onSuccess={(msg) => { showToast(msg); load(); }}
        />
      )}
      {roleTarget && (
        <RoleModal
          user={roleTarget}
          isSelf={roleTarget.id === currentUserId}
          onClose={() => setRoleTarget(null)}
          onSuccess={(msg) => { showToast(msg); load(); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-emerald-500/30 bg-[var(--bg-card)] px-5 py-3 text-sm font-semibold text-emerald-300 shadow-2xl backdrop-blur-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
