"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import type { Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);
  const { user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    coursesApi
      .get(courseId)
      .then(setCourse)
      .catch((err) => setError(err.message || "Failed to load course"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (Number.isNaN(courseId)) {
      setError("Invalid course link.");
      setLoading(false);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  async function handleEnroll() {
    if (!user) {
      router.push("/login");
      return;
    }
    setEnrolling(true);
    setEnrollError(null);
    setEnrollMessage(null);
    try {
      await coursesApi.enroll(courseId);
      setEnrollMessage("Successfully enrolled! Visit 'My Courses' to start learning.");
    } catch (err) {
      setEnrollError(err instanceof ApiError ? err.message : "Failed to enroll.");
    } finally {
      setEnrolling(false);
    }
  }

  if (loading) return <Spinner label="Loading course..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!course) return <ErrorMessage message="Course not found." />;

  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;

  return (
    <div className="animate-fade-in">
      <div className="mb-8 overflow-hidden rounded-2xl bg-brand-gradient p-8 text-white shadow-card">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium capitalize backdrop-blur-sm">
            {course.level}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium capitalize backdrop-blur-sm">
            {course.status}
          </span>
          {totalLessons > 0 && (
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
              {totalLessons} lessons
            </span>
          )}
        </div>
        <h1 className="mb-3 max-w-2xl text-3xl font-bold">{course.title}</h1>
        <p className="mb-6 max-w-2xl text-white/85">{course.description}</p>

        {user?.role === "student" && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="rounded-full bg-white px-5 py-2.5 font-medium text-primary-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enrolling ? "Enrolling..." : "Enroll in this course"}
          </button>
        )}
        {!user && (
          <button
            onClick={handleEnroll}
            className="rounded-full bg-white px-5 py-2.5 font-medium text-primary-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Log in to enroll
          </button>
        )}
      </div>

      <SuccessMessage message={enrollMessage} />
      <ErrorMessage message={enrollError} />

      <h2 className="mb-4 text-xl font-semibold text-ink">Course Content</h2>
      {(!course.modules || course.modules.length === 0) && (
        <p className="text-ink-soft">No modules published yet.</p>
      )}
      <div className="space-y-4">
        {course.modules
          ?.slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((mod, idx) => (
            <div key={mod.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-ink">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary-dark">
                  {idx + 1}
                </span>
                {mod.title}
              </h3>
              {mod.lessons && mod.lessons.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-ink-soft">
                        {lesson.title}{" "}
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs uppercase text-gray-500">
                          {lesson.contentType}
                        </span>
                      </span>
                      <span className="text-gray-400">{lesson.duration} min</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No lessons yet.</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
