"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { notificationsApi, ApiError } from "@/lib/api";
import type { Notification } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    notificationsApi
      .list()
      .then(setNotifications)
      .catch((err) => setError(err.message || "Failed to load notifications"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function markRead(ids: number[]) {
    try {
      await notificationsApi.markRead(ids);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notifications.");
    }
  }

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => markRead([])}
          className="text-sm font-medium text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {loading && <Spinner label="Loading notifications..." />}
      <ErrorMessage message={error} />

      {!loading && !error && notifications.length === 0 && (
        <p className="text-gray-500">No notifications.</p>
      )}

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center justify-between px-4 py-3 ${
              n.isRead ? "" : "bg-primary-light/30"
            }`}
          >
            <div>
              <p className={`text-sm ${n.isRead ? "text-gray-600" : "font-medium text-gray-900"}`}>
                {n.message}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => markRead([n.id])}
                className="text-xs font-medium text-primary hover:underline"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
