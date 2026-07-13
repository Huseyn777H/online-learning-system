"use client";

import { useEffect, useRef, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

const PAGE_SIZE = 20;

export default function AdminCoursesPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // See admin/users/page.tsx for why: prevents an older, slower response
  // from clobbering state after a newer request has already resolved.
  const requestIdRef = useRef(0);

  function load() {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    coursesApi
      .list({ page, pageSize: PAGE_SIZE, status: statusFilter || undefined })
      .then((res) => {
        if (requestIdRef.current !== requestId) return;
        setCourses(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setError(err.message || "Failed to load courses");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, statusFilter]);

  async function handleStatusChange(courseId: number, status: string) {
    setSavingId(courseId);
    setError(null);
    setMessage(null);
    try {
      await coursesApi.update(courseId, { status: status as Course["status"] });
      setMessage("Course status updated.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update course.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(courseId: number) {
    setSavingId(courseId);
    setError(null);
    setMessage(null);
    try {
      await coursesApi.remove(courseId);
      setMessage("Course deactivated.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete course.");
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading || !user) return <Spinner />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <Spinner label="Loading courses..." />}
      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {!loading && courses.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Teacher ID</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{c.level}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.status}
                      disabled={savingId === c.id}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs capitalize focus:border-primary focus:outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.teacherId}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={savingId === c.id}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
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
