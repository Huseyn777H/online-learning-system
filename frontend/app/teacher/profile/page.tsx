"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi } from "@/lib/api";
import type { Course } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ProfileForm from "@/components/ProfileForm";
import ProfileHeader from "@/components/ProfileHeader";
import StatCard from "@/components/StatCard";

export default function TeacherProfilePage() {
  const { user, loading } = useRequireAuth(["teacher"]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    coursesApi
      .list({ teacherId: user.id, page: 1, pageSize: 100 })
      .then((res) => setCourses(res.items))
      .catch(() => setCourses([]))
      .finally(() => setStatsLoading(false));
  }, [user]);

  if (loading || !user) return <Spinner />;

  const published = courses.filter((c) => c.status === "published").length;
  const drafts = courses.filter((c) => c.status === "draft").length;

  return (
    <div className="animate-fade-in">
      <ProfileHeader user={user} />

      {!statsLoading && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Courses Created" value={courses.length} />
          <StatCard label="Published" value={published} />
          <StatCard label="Drafts" value={drafts} />
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold text-ink">Account settings</h2>
      <ProfileForm />
    </div>
  );
}
