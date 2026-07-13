"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi } from "@/lib/api";
import type { Course } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coursesApi
      .search({ page: 1, pageSize: 6 })
      .then((res) => setCourses(res.items))
      .catch((err) => setError(err.message || "Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <section className="mb-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark px-8 py-16 text-center text-white">
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Learn Without Limits</h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-primary-light">
          Join courses taught by expert instructors, track your progress, and earn certificates.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/courses"
            className="rounded-md bg-white px-6 py-3 font-semibold text-primary-dark hover:bg-gray-100"
          >
            Browse Courses
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-white px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            Get Started
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Featured Courses</h2>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>

        {loading && <Spinner label="Loading courses..." />}
        <ErrorMessage message={error} />

        {!loading && !error && courses.length === 0 && (
          <p className="text-gray-500">No published courses yet. Check back soon.</p>
        )}

        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
