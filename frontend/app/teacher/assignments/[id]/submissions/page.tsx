"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { submissionsApi, ApiError } from "@/lib/api";
import type { Submission } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function SubmissionsPage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const params = useParams();
  const assignmentId = Number(params.id);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Record<number, { score: string; feedback: string }>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, { ok: boolean; message: string }>>({});

  function load() {
    setLoading(true);
    submissionsApi
      .listByAssignment(assignmentId)
      .then(setSubmissions)
      .catch((err) => setError(err.message || "Failed to load submissions"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(assignmentId)) {
      setError("Invalid assignment link.");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, assignmentId]);

  async function handleGrade(submissionId: number) {
    const g = grades[submissionId];
    if (g?.score === undefined || g.score === "") {
      setResults((r) => ({ ...r, [submissionId]: { ok: false, message: "Please enter a score." } }));
      return;
    }
    if (Number(g.score) < 0) {
      setResults((r) => ({
        ...r,
        [submissionId]: { ok: false, message: "Score can't be negative." },
      }));
      return;
    }
    setSaving(submissionId);
    try {
      await submissionsApi.grade(submissionId, {
        score: Number(g.score),
        feedback: g.feedback ?? "",
      });
      setResults((r) => ({ ...r, [submissionId]: { ok: true, message: "Graded successfully." } }));
      load();
    } catch (err) {
      setResults((r) => ({
        ...r,
        [submissionId]: { ok: false, message: err instanceof ApiError ? err.message : "Failed to grade." },
      }));
    } finally {
      setSaving(null);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading submissions..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Submissions</h1>

      {submissions.length === 0 && <p className="text-gray-500">No submissions yet.</p>}

      <div className="space-y-4">
        {submissions.map((s) => {
          const g = grades[s.id] ?? { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
          const result = results[s.id];
          return (
            <div key={s.id} className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Student #{s.studentId}</span>
                <div className="flex items-center gap-2 text-xs">
                  {s.isLate && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700">Late</span>
                  )}
                  <span className="text-gray-400">{new Date(s.submittedAt).toLocaleString()}</span>
                </div>
              </div>
              <a
                href={s.answerUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 block text-sm font-medium text-primary hover:underline"
              >
                View submitted answer &rarr;
              </a>

              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label htmlFor={`score-${s.id}`} className="mb-1 block text-xs text-gray-500">
                    Score
                  </label>
                  <input
                    id={`score-${s.id}`}
                    type="number"
                    min={0}
                    value={g.score}
                    onChange={(e) => setGrades((m) => ({ ...m, [s.id]: { ...g, score: e.target.value } }))}
                    className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label htmlFor={`feedback-${s.id}`} className="mb-1 block text-xs text-gray-500">
                    Feedback
                  </label>
                  <input
                    id={`feedback-${s.id}`}
                    type="text"
                    value={g.feedback}
                    onChange={(e) => setGrades((m) => ({ ...m, [s.id]: { ...g, feedback: e.target.value } }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handleGrade(s.id)}
                  disabled={saving === s.id}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
                >
                  {saving === s.id ? "Saving..." : "Save grade"}
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
