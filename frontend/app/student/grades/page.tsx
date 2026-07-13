"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { submissionsApi } from "@/lib/api";
import type { Submission } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function StudentGradesPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    submissionsApi
      .mine()
      .then(setSubmissions)
      .catch((err) => setError(err.message || "Failed to load grades"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Grades</h1>
      {loading && <Spinner label="Loading grades..." />}
      <ErrorMessage message={error} />

      {!loading && !error && submissions.length === 0 && (
        <p className="text-gray-500">No submissions yet.</p>
      )}

      {!loading && submissions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {s.isLate && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Late
                      </span>
                    )}
                    {!s.isLate && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        On time
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {s.score !== null ? s.score : <span className="text-gray-400">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.feedback || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
