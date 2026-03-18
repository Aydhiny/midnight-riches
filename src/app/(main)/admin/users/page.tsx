"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminUsers, adminAdjustBalance } from "@/server/actions/admin";
import { formatCurrency } from "@/lib/utils";
import type { AdminUserRow } from "@/types";

export default function AdminUsersPage() {
  const [usersList, setUsersList] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Balance adjustment state
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const result = await getAdminUsers({
      query: search || undefined,
      page,
      limit: 20,
    });
    if (result.success) {
      setUsersList(result.data.users);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleAdjust() {
    if (!adjustUserId || !adjustAmount || !adjustReason) return;
    const amount = parseFloat(adjustAmount);
    if (isNaN(amount)) return;

    const result = await adminAdjustBalance({
      userId: adjustUserId,
      amount,
      reason: adjustReason,
    });

    if (result.success) {
      setAdjustUserId(null);
      setAdjustAmount("");
      setAdjustReason("");
      loadUsers();
    }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-purple-400">
              {total} users total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-800/30 text-left text-purple-400">
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Balance</th>
                    <th className="pb-2 pr-4">Joined</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-purple-800/10"
                    >
                      <td className="py-2 pr-4 font-mono text-xs">
                        {u.email}
                      </td>
                      <td className="py-2 pr-4">{u.name || "—"}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={
                            u.role === "admin"
                              ? "text-yellow-400"
                              : "text-purple-300"
                          }
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-yellow-400">
                        {formatCurrency(u.balance)}
                      </td>
                      <td className="py-2 pr-4 text-purple-300">
                        {u.createdAt.toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAdjustUserId(
                              adjustUserId === u.id ? null : u.id
                            )
                          }
                        >
                          Adjust
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

      {/* Balance Adjustment Modal */}
      {adjustUserId && (
        <Card>
          <CardHeader>
            <CardTitle>Adjust Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              type="number"
              placeholder="Amount (negative to deduct)"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
            />
            <Input
              placeholder="Reason"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="gold" onClick={handleAdjust}>
                Confirm
              </Button>
              <Button
                variant="outline"
                onClick={() => setAdjustUserId(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
