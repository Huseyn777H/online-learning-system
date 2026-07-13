"use client";

import { useRequireAuth } from "@/lib/useRequireAuth";
import Spinner from "@/components/Spinner";
import ProfileForm from "@/components/ProfileForm";

export default function StudentProfilePage() {
  const { user, loading } = useRequireAuth(["student"]);
  if (loading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Profile</h1>
      <ProfileForm />
    </div>
  );
}
