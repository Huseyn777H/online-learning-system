"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";

const roleLinks: Record<string, { href: string; label: string }[]> = {
  student: [
    { href: "/student", label: "My Courses" },
    { href: "/student/assignments", label: "Assignments" },
    { href: "/student/grades", label: "Grades" },
    { href: "/student/notifications", label: "Notifications" },
    { href: "/student/profile", label: "Profile" },
  ],
  teacher: [
    { href: "/teacher", label: "My Courses" },
    { href: "/teacher/courses/new", label: "New Course" },
    { href: "/teacher/profile", label: "Profile" },
  ],
  admin: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/settings", label: "Settings" },
  ],
};

export default function Nav() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [{ href: "/courses", label: "Courses" }, ...(user ? roleLinks[user.role] ?? [] : [])];

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="bg-brand-gradient bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
          OLS
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                pathname === link.href
                  ? "bg-primary-light text-primary-dark"
                  : "text-ink-soft hover:bg-gray-100 hover:text-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {loading ? null : user ? (
            <>
              <NotificationBell />
              <div className="hidden items-center gap-2 sm:flex">
                <Avatar name={user.fullName} size="sm" />
                <span className="text-sm text-ink-soft">{user.fullName.split(" ")[0]}</span>
              </div>
              <button
                onClick={logout}
                className="rounded-full border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-gray-400 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-gray-100 sm:inline-block"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-dark"
              >
                Register
              </Link>
            </>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="rounded-md p-2 text-ink-soft hover:bg-gray-100 md:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  pathname === link.href ? "bg-primary-light text-primary-dark" : "text-ink-soft hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path
        fillRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5A.75.75 0 012.75 9h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zM2.75 14a.75.75 0 000 1.5h14.5a.75.75 0 000-1.5H2.75z"
        clipRule="evenodd"
      />
    </svg>
  );
}
