"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coursesApi, categoriesApi } from "@/lib/api";
import type { Course, Category } from "@/lib/types";
import CourseCard from "@/components/CourseCard";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    coursesApi
      .search({ page: 1, pageSize: 6 })
      .then((res) => {
        setCourses(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message || "Failed to load courses"))
      .finally(() => setLoading(false));
    categoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  return (
    <div>
      <section className="relative mb-14 overflow-hidden rounded-3xl bg-brand-gradient px-8 py-20 text-center text-white shadow-card sm:py-24">
        <h1 className="mx-auto mb-4 max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Learn Without Limits
        </h1>
        <p className="mx-auto mb-8 max-w-xl text-lg text-white/85">
          Join courses taught by expert instructors, track your progress, and earn certificates.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/courses"
            className="rounded-full bg-white px-6 py-3 font-semibold text-primary-dark shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            Browse Courses
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-white/70 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Get Started
          </Link>
        </div>

        <div className="mx-auto mt-12 flex max-w-md flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-white/80">
          <Stat value={total !== null ? `${total}+` : "—"} label="Courses" />
          <Stat value={categories.length > 0 ? `${categories.length}` : "—"} label="Categories" />
          <Stat value="24/7" label="Access" />
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink">Featured Courses</h2>
          <Link href="/courses" className="text-sm font-medium text-primary hover:underline">
            View all &rarr;
          </Link>
        </div>

        {loading && <Spinner label="Loading courses..." />}
        <ErrorMessage message={error} />

        {!loading && !error && courses.length === 0 && (
          <p className="text-ink-soft">No published courses yet. Check back soon.</p>
        )}

        {!loading && courses.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <div key={c.id} className="animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                <CourseCard course={c} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
    </div>
  );
}
