"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { categoriesApi, coursesApi, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function NewCoursePage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [level, setLevel] = useState("beginner");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title || !description || !categoryId) {
      setError("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    try {
      const course = await coursesApi.create({
        title,
        description,
        categoryId: Number(categoryId),
        level,
      });
      router.push(`/teacher/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create course.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return <Spinner />;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create a New Course</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <ErrorMessage message={error} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        <p className="text-xs text-gray-400">
          New courses start as a draft. Ask an admin to publish it once it&apos;s ready.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Creating..." : "Create Course"}
        </button>
      </form>
    </div>
  );
}
