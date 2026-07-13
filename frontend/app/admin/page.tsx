"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { adminApi } from "@/lib/api";
import type { AdminStats } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import StatCard from "@/components/StatCard";

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    adminApi
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      {loading && <Spinner label="Loading stats..." />}
      <ErrorMessage message={error} />

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Total Students" value={stats.totalStudents} />
          <StatCard label="Total Teachers" value={stats.totalTeachers} />
          <StatCard label="Total Courses" value={stats.totalCourses} />
          <StatCard label="Active Enrollments" value={stats.activeEnrollments} />
          <StatCard label="Assignments Submitted" value={stats.assignmentsSubmitted} />
        </div>
      )}
    </div>
  );
}
