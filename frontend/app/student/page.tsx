"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { enrollmentsApi, certificatesApi, ApiError } from "@/lib/api";
import type { Enrollment } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import ProgressBar from "@/components/ProgressBar";

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [certMessage, setCertMessage] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!user) return;
    enrollmentsApi
      .mine()
      .then(setEnrollments)
      .catch((err) => setError(err.message || "Failed to load your courses"))
      .finally(() => setLoading(false));
  }, [user]);

  async function handleCertificate(courseId: number) {
    setCertMessage((m) => ({ ...m, [courseId]: "Generating..." }));
    try {
      const cert = await certificatesApi.generate({ courseId });
      setCertMessage((m) => ({ ...m, [courseId]: `Certificate ready: ${cert.certificateCode}` }));
      window.open(cert.certificateUrl, "_blank");
    } catch (err) {
      setCertMessage((m) => ({
        ...m,
        [courseId]: err instanceof ApiError ? err.message : "Failed to generate certificate.",
      }));
    }
  }

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Courses</h1>
      {loading && <Spinner label="Loading your courses..." />}
      <ErrorMessage message={error} />

      {!loading && !error && enrollments.length === 0 && (
        <p className="text-gray-500">
          You haven&apos;t enrolled in any courses yet.{" "}
          <Link href="/courses" className="font-medium text-primary hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {enrollments.map((e) => (
          <div key={e.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">
              {e.course?.title ?? `Course #${e.courseId}`}
            </h3>
            <div className="mb-3">
              <ProgressBar progress={e.progress} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/student/courses/${e.courseId}`}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
              >
                Continue learning
              </Link>
              {e.progress >= 100 && (
                <button
                  onClick={() => handleCertificate(e.courseId)}
                  className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light"
                >
                  Get certificate
                </button>
              )}
            </div>
            {certMessage[e.courseId] && (
              <p className="mt-2 text-xs text-gray-500">{certMessage[e.courseId]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
