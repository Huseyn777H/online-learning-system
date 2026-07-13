"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/lib/types";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    notificationsApi
      .list()
      .then((items) => {
        setNotifications(items);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    try {
      await notificationsApi.markRead([]);
      load();
    } catch {
      // ignore, UX-only
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!loaded && <div className="p-4 text-sm text-gray-400">Loading...</div>}
            {loaded && notifications.length === 0 && (
              <div className="p-4 text-sm text-gray-400">No notifications yet.</div>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`border-b border-gray-50 px-4 py-3 text-sm ${
                  n.isRead ? "text-gray-500" : "bg-primary-light/40 font-medium text-gray-800"
                }`}
              >
                {n.message}
                <div className="mt-1 text-[11px] text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 px-4 py-2 text-center">
            <Link
              href="/student/notifications"
              className="text-xs text-primary hover:underline"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206A19.7 19.7 0 0112 17.25a19.7 19.7 0 01-8.571-1.774.75.75 0 01-.297-1.206A8.22 8.22 0 005.25 9.75V9z"
        clipRule="evenodd"
      />
      <path d="M8.05 19.435a1.05 1.05 0 000 .04c0 1.4 1.567 2.525 3.5 2.525s3.5-1.125 3.5-2.525c0-.013 0-.026-.002-.04a24.522 24.522 0 01-6.996 0z" />
    </svg>
  );
}
