"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { assignmentsApi, ApiError } from "@/lib/api";
import type { Assignment } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function StudentAssignmentsPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answerUrls, setAnswerUrls] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, { ok: boolean; message: string }>>({});

  useEffect(() => {
    if (!user) return;
    assignmentsApi
      .mine()
      .then(setAssignments)
      .catch((err) => setError(err.message || "Failed to load assignments"))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleSubmit(assignmentId: number) {
    const answerUrl = answerUrls[assignmentId];
    if (!answerUrl) {
      setResults((r) => ({ ...r, [assignmentId]: { ok: false, message: "Please provide an answer URL." } }));
      return;
    }
    setSubmitting(assignmentId);
    try {
      const submission = await assignmentsApi.submit(assignmentId, { answerUrl });
      setResults((r) => ({
        ...r,
        [assignmentId]: {
          ok: true,
          message: submission.isLate
            ? "Submitted (marked late)."
            : "Submitted successfully.",
        },
      }));
    } catch (err) {
      setResults((r) => ({
        ...r,
        [assignmentId]: {
          ok: false,
          message: err instanceof ApiError ? err.message : "Submission failed.",
        },
      }));
    } finally {
      setSubmitting(null);
    }
  }

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Assignments</h1>
      {loading && <Spinner label="Loading assignments..." />}
      <ErrorMessage message={error} />

      {!loading && !error && assignments.length === 0 && (
        <p className="text-gray-500">No assignments yet.</p>
      )}

      <div className="space-y-4">
        {assignments.map((a) => {
          const result = results[a.id];
          return (
            <div key={a.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
                <span className="text-xs text-gray-400">
                  Due {new Date(a.deadline).toLocaleString()}
                </span>
              </div>
              <p className="mb-3 text-sm text-gray-600">{a.description}</p>
              <p className="mb-3 text-xs text-gray-400">Max score: {a.maxScore}</p>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  placeholder="Answer URL (e.g. link to your submission file)"
                  aria-label={`Answer URL for ${a.title}`}
                  value={answerUrls[a.id] ?? ""}
                  onChange={(e) => setAnswerUrls((m) => ({ ...m, [a.id]: e.target.value }))}
                  className="min-w-[260px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  onClick={() => handleSubmit(a.id)}
                  disabled={submitting === a.id}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {submitting === a.id ? "Submitting..." : "Submit"}
                </button>
              </div>
              {result && (
                result.ok ? <SuccessMessage message={result.message} /> : <ErrorMessage message={result.message} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
