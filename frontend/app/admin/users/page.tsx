"use client";

import { useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { adminApi, ApiError } from "@/lib/api";
import type { Role, User } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Guards against out-of-order responses: if the user flips pages/filters
  // quickly, an older, slower request could resolve after a newer one and
  // clobber the table with stale data. Each load() call gets an id; only the
  // most recent one is allowed to commit state.
  const requestIdRef = useRef(0);

  function load() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    adminApi
      .users({ page, pageSize: PAGE_SIZE, role: roleFilter || undefined })
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setError(err.message || "Failed to load users");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, roleFilter]);

  async function handleRoleChange(userId: number, role: Role) {
    setSavingId(userId);
    setError(null);
    try {
      await adminApi.updateUserRole(userId, { role });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update role.");
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading || !user) return <Spinner />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <select
          value={roleFilter}
          onChange={(e) => {
            setPage(1);
            setRoleFilter(e.target.value);
          }}
          aria-label="Filter by role"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading && <Spinner label="Loading users..." />}
      <ErrorMessage message={error} />

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const isSelf = u.id === user.id;
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.fullName}
                      {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={savingId === u.id || isSelf}
                        title={isSelf ? "You can't change your own role." : undefined}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        aria-label={`Role for ${u.fullName}`}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs capitalize focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
