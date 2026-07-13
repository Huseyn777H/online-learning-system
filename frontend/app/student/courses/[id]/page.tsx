"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi, quizzesApi } from "@/lib/api";
import type { Course, Quiz } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function StudentCourseViewPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(courseId)) {
      setError("Invalid course link.");
      setLoading(false);
      return;
    }
    coursesApi
      .get(courseId)
      .then(setCourse)
      .catch((err) => setError(err.message || "Failed to load course"))
      .finally(() => setLoading(false));
    quizzesApi
      .listByCourse(courseId)
      .then(setQuizzes)
      .catch(() => setQuizzes([]));
  }, [user, courseId]);

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading course..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!course) return <ErrorMessage message="Course not found." />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{course.title}</h1>
      <p className="mb-6 text-gray-600">{course.description}</p>

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
                      <Link
                        href={`/student/lessons/${lesson.id}?courseId=${course.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      <span className="flex items-center gap-2">
                        {lesson.completed && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Completed
                          </span>
                        )}
                        <span className="text-gray-400">{lesson.duration} min</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No lessons yet.</p>
              )}
            </div>
          ))}
        {(!course.modules || course.modules.length === 0) && (
          <p className="text-gray-500">No modules published yet.</p>
        )}
      </div>

      {quizzes.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Quizzes</h2>
          <ul className="space-y-2">
            {quizzes.map((q) => (
              <li
                key={q.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-800">{q.title}</p>
                  <p className="text-xs text-gray-400">Passing score: {q.passingScore}</p>
                </div>
                <Link
                  href={`/student/quizzes/${q.id}`}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                >
                  Take quiz
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
