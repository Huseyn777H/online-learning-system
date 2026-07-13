"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { assignmentsApi, coursesApi, ApiError } from "@/lib/api";
import type { Assignment, Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function TeacherAssignmentsPage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([coursesApi.get(courseId), assignmentsApi.listByCourse(courseId)])
      .then(([c, a]) => {
        setCourse(c);
        setAssignments(a);
      })
      .catch((err) => setError(err.message || "Failed to load assignments"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(courseId)) {
      setError("Invalid course link.");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, courseId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title || !description || !deadline || !maxScore) {
      setError("Please fill in all fields.");
      return;
    }
    if (!(Number(maxScore) > 0)) {
      setError("Max score must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      await assignmentsApi.create({
        courseId,
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        maxScore: Number(maxScore),
      });
      setTitle("");
      setDescription("");
      setDeadline("");
      setMaxScore("100");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading assignments..." />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Assignments</h1>
      <p className="mb-6 text-sm text-gray-500">{course?.title}</p>

      <ErrorMessage message={error} />

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">New Assignment</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            type="text"
            placeholder="Title"
            aria-label="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-2"
          />
          <textarea
            placeholder="Description"
            aria-label="Assignment description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-2"
          />
          <div>
            <label htmlFor="assignment-deadline" className="mb-1 block text-xs text-gray-500">
              Deadline
            </label>
            <input
              id="assignment-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="assignment-maxscore" className="mb-1 block text-xs text-gray-500">
              Max score
            </label>
            <input
              id="assignment-maxscore"
              type="number"
              min={1}
              value={maxScore}
              onChange={(e) => setMaxScore(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 sm:col-span-2"
          >
            {submitting ? "Creating..." : "Create Assignment"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {assignments.length === 0 && <p className="text-gray-500">No assignments yet.</p>}
        {assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <h3 className="font-medium text-gray-900">{a.title}</h3>
              <p className="text-xs text-gray-400">
                Due {new Date(a.deadline).toLocaleString()} &middot; Max score {a.maxScore}
              </p>
            </div>
            <Link
              href={`/teacher/assignments/${a.id}/submissions`}
              className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
            >
              View submissions
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
