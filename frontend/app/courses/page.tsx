"use client";

import { useEffect, useState } from "react";
import { coursesApi } from "@/lib/api";
import type { Course } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import CourseFilterBar, { CourseFilters } from "@/components/CourseFilterBar";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

const PAGE_SIZE = 9;

export default function CourseCatalogPage() {
  const [filters, setFilters] = useState<CourseFilters>({ keyword: "", category: "", level: "" });
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    coursesApi
      .search({
        keyword: filters.keyword || undefined,
        category: filters.category || undefined,
        level: filters.level || undefined,
        page,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (cancelled) return;
        setCourses(res.items);
        setTotal(res.total);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load courses");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Course Catalog</h1>
      <CourseFilterBar
        filters={filters}
        onChange={(f) => {
          setPage(1);
          setFilters(f);
        }}
      />

      {loading && <Spinner label="Loading courses..." />}
      <ErrorMessage message={error} />

      {!loading && !error && courses.length === 0 && (
        <p className="text-gray-500">No courses match your filters.</p>
      )}

      {!loading && courses.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
