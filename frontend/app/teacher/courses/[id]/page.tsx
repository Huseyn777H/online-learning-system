"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi, modulesApi, lessonsApi, ApiError } from "@/lib/api";
import type { Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function CourseBuilderPage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSubmitting, setModuleSubmitting] = useState(false);

  const [lessonForms, setLessonForms] = useState<
    Record<number, { title: string; contentType: string; contentUrl: string; duration: string }>
  >({});
  const [lessonSubmitting, setLessonSubmitting] = useState<number | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  function load() {
    setLoading(true);
    coursesApi
      .get(courseId)
      .then(setCourse)
      .catch((err) => setError(err.message || "Failed to load course"))
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

  async function handleAddModule(e: React.FormEvent) {
    e.preventDefault();
    if (!moduleTitle) return;
    setModuleSubmitting(true);
    setError(null);
    try {
      const orderIndex = (course?.modules?.length ?? 0) + 1;
      await modulesApi.create({ courseId, title: moduleTitle, orderIndex });
      setModuleTitle("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add module.");
    } finally {
      setModuleSubmitting(false);
    }
  }

  async function handleAddLesson(moduleId: number, e: React.FormEvent) {
    e.preventDefault();
    const form = lessonForms[moduleId];
    if (!form?.title || !form?.contentUrl || !form?.duration) {
      setError("Please fill in all lesson fields.");
      return;
    }
    if (!(Number(form.duration) > 0)) {
      setError("Duration must be a positive number of minutes.");
      return;
    }
    setLessonSubmitting(moduleId);
    setError(null);
    try {
      await lessonsApi.create({
        moduleId,
        title: form.title,
        contentType: form.contentType || "video",
        contentUrl: form.contentUrl,
        duration: Number(form.duration),
      });
      setLessonForms((f) => ({ ...f, [moduleId]: { title: "", contentType: "video", contentUrl: "", duration: "" } }));
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add lesson.");
    } finally {
      setLessonSubmitting(null);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusSaving(true);
    setStatusMessage(null);
    setError(null);
    try {
      await coursesApi.update(courseId, { status: newStatus as Course["status"] });
      setStatusMessage(`Course status updated to "${newStatus}".`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status.");
    } finally {
      setStatusSaving(false);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading course..." />;
  if (!course) return <ErrorMessage message={error ?? "Course not found."} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-sm text-gray-500">Course Builder</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="course-status" className="text-sm text-gray-600">
            Status:
          </label>
          <select
            id="course-status"
            value={course.status}
            disabled={statusSaving}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm capitalize focus:border-primary focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={statusMessage} />

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">Add Module</h2>
        <form onSubmit={handleAddModule} className="flex gap-2">
          <input
            type="text"
            placeholder="Module title"
            aria-label="Module title"
            value={moduleTitle}
            onChange={(e) => setModuleTitle(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={moduleSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {moduleSubmitting ? "Adding..." : "Add Module"}
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {course.modules
          ?.slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((mod) => {
            const form = lessonForms[mod.id] ?? {
              title: "",
              contentType: "video",
              contentUrl: "",
              duration: "",
            };
            return (
              <div key={mod.id} className="rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-3 font-semibold text-gray-800">
                  {mod.orderIndex}. {mod.title}
                </h3>

                {mod.lessons && mod.lessons.length > 0 ? (
                  <ul className="mb-4 divide-y divide-gray-100">
                    {mod.lessons.map((lesson) => (
                      <li key={lesson.id} className="flex items-center justify-between py-2 text-sm">
                        <span>
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
                  <p className="mb-4 text-sm text-gray-400">No lessons yet.</p>
                )}

                <form
                  onSubmit={(e) => handleAddLesson(mod.id, e)}
                  className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-4 sm:grid-cols-5"
                >
                  <input
                    type="text"
                    placeholder="Lesson title"
                    aria-label="Lesson title"
                    value={form.title}
                    onChange={(e) =>
                      setLessonForms((f) => ({ ...f, [mod.id]: { ...form, title: e.target.value } }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none sm:col-span-2"
                  />
                  <select
                    value={form.contentType}
                    aria-label="Lesson content type"
                    onChange={(e) =>
                      setLessonForms((f) => ({ ...f, [mod.id]: { ...form, contentType: e.target.value } }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="video">Video</option>
                    <option value="pdf">PDF</option>
                    <option value="text">Text</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Content URL"
                    aria-label="Lesson content URL"
                    value={form.contentUrl}
                    onChange={(e) =>
                      setLessonForms((f) => ({ ...f, [mod.id]: { ...form, contentUrl: e.target.value } }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    min={1}
                    placeholder="Duration (min)"
                    aria-label="Lesson duration in minutes"
                    value={form.duration}
                    onChange={(e) =>
                      setLessonForms((f) => ({ ...f, [mod.id]: { ...form, duration: e.target.value } }))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={lessonSubmitting === mod.id}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 sm:col-span-5"
                  >
                    {lessonSubmitting === mod.id ? "Adding lesson..." : "Add Lesson"}
                  </button>
                </form>
              </div>
            );
          })}
        {(!course.modules || course.modules.length === 0) && (
          <p className="text-gray-500">No modules yet. Add one above to get started.</p>
        )}
      </div>
    </div>
  );
}
