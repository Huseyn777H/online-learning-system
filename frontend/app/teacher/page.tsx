"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi } from "@/lib/api";
import type { Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function TeacherDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    coursesApi
      .list({ teacherId: user.id, page: 1, pageSize: 50 })
      .then((res) => setCourses(res.items))
      .catch((err) => setError(err.message || "Failed to load your courses"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <Link
          href="/teacher/courses/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
        >
          + New Course
        </Link>
      </div>

      {loading && <Spinner label="Loading your courses..." />}
      <ErrorMessage message={error} />

      {!loading && !error && courses.length === 0 && (
        <p className="text-gray-500">You haven&apos;t created any courses yet.</p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex gap-2">
              <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark capitalize">
                {c.level}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 capitalize">
                {c.status}
              </span>
            </div>
            <h3 className="mb-1 font-semibold text-gray-900">{c.title}</h3>
            <p className="mb-3 line-clamp-3 text-sm text-gray-600">{c.description}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/teacher/courses/${c.id}`}
                className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
              >
                Manage content
              </Link>
              <Link
                href={`/teacher/courses/${c.id}/assignments`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Assignments
              </Link>
              <Link
                href={`/teacher/courses/${c.id}/quiz`}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Quiz
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
