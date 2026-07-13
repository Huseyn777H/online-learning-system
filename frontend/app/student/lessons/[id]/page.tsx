"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi, lessonsApi, ApiError } from "@/lib/api";
import type { Course, Lesson } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function LessonViewPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const lessonId = Number(params.id);
  const courseId = Number(searchParams.get("courseId"));

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    // A missing/invalid courseId (e.g. a bookmarked or shared link that
    // dropped the ?courseId= query param) previously left this effect a
    // no-op, so `loading` never flipped to false and the page spun forever
    // with no feedback. Surface a real error instead.
    if (Number.isNaN(courseId)) {
      setError("Missing course reference — please open this lesson from its course page.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    coursesApi
      .get(courseId)
      .then((c) => {
        setCourse(c);
        const found = c.modules?.flatMap((m) => m.lessons ?? []).find((l) => l.id === lessonId);
        setLesson(found ?? null);
        if (!found) setError("Lesson not found in this course.");
      })
      .catch((err) => setError(err.message || "Failed to load lesson"))
      .finally(() => setLoading(false));
  }, [user, courseId, lessonId]);

  async function handleComplete() {
    setMarking(true);
    setError(null);
    setMessage(null);
    try {
      await lessonsApi.complete(lessonId);
      setMessage("Lesson marked as complete! Your progress has been updated.");
      setLesson((l) => (l ? { ...l, completed: true } : l));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to mark lesson complete.");
    } finally {
      setMarking(false);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading lesson..." />;
  if (error && !lesson) return <ErrorMessage message={error} />;
  if (!lesson) return <ErrorMessage message="Lesson not found." />;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-500 hover:text-gray-800"
      >
        &larr; Back to course
      </button>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">{lesson.title}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {course?.title} &middot; {lesson.contentType.toUpperCase()} &middot; {lesson.duration} min
      </p>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
        {lesson.contentUrl ? (
          lesson.contentType === "video" ? (
            <video controls className="w-full rounded" src={lesson.contentUrl} />
          ) : (
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Open lesson content &rarr;
            </a>
          )
        ) : (
          <p className="text-gray-400">Content unavailable.</p>
        )}
      </div>

      <SuccessMessage message={message} />
      <ErrorMessage message={error} />

      {lesson.completed ? (
        <span className="inline-block rounded-md bg-green-100 px-4 py-2 font-medium text-green-700">
          Completed
        </span>
      ) : (
        <button
          onClick={handleComplete}
          disabled={marking}
          className="rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {marking ? "Marking complete..." : "Mark complete"}
        </button>
      )}

      {course && (
        <div className="mt-6">
          <Link
            href={`/student/courses/${course.id}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View all lessons in this course
          </Link>
        </div>
      )}
    </div>
  );
}
