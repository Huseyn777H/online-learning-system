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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex gap-2">
            <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark capitalize">
              {course.level}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 capitalize">
              {course.status}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        </div>
        {user?.role === "student" && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {enrolling ? "Enrolling..." : "Enroll in this course"}
          </button>
        )}
        {!user && (
          <button
            onClick={handleEnroll}
            className="rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark"
          >
            Log in to enroll
          </button>
        )}
      </div>

      <SuccessMessage message={enrollMessage} />
      <ErrorMessage message={enrollError} />

      <p className="mb-8 max-w-3xl text-gray-700">{course.description}</p>

      <h2 className="mb-4 text-xl font-semibold text-gray-900">Course Content</h2>
      {(!course.modules || course.modules.length === 0) && (
        <p className="text-gray-500">No modules published yet.</p>
      )}
      <div className="space-y-4">
        {course.modules
          ?.slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((mod) => (
            <div key={mod.id} className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-800">{mod.title}</h3>
              {mod.lessons && mod.lessons.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-gray-700">
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
