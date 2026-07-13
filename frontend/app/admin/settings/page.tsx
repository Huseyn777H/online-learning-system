"use client";

import { useRequireAuth } from "@/lib/useRequireAuth";
import Spinner from "@/components/Spinner";

export default function AdminSettingsPage() {
  const { user, loading } = useRequireAuth(["admin"]);
  if (loading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
        <p className="mb-2 text-lg font-medium text-gray-700">More settings coming soon</p>
        <p className="text-sm">
          Platform-wide configuration (e.g. certificate templates, cache TTLs, file upload limits)
          will be manageable here in a future release.
        </p>
      </div>
    </div>
  );
}
