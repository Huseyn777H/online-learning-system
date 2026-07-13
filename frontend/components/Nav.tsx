"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import NotificationBell from "./NotificationBell";

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

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primary">
          OLS
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <Link
            href="/courses"
            className={`text-sm font-medium ${
              pathname === "/courses" ? "text-primary" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Courses
          </Link>
          {user &&
            roleLinks[user.role]?.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href ? "text-primary" : "text-gray-600 hover:text-gray-900"
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
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.fullName} <span className="text-gray-400">({user.role})</span>
              </span>
              <button
                onClick={logout}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-dark"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
