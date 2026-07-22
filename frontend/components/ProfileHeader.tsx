import Avatar from "./Avatar";
import type { User } from "@/lib/types";

const ROLE_STYLES: Record<string, string> = {
  student: "bg-primary-light text-primary-dark",
  teacher: "bg-accent-light text-accent-dark",
  admin: "bg-amber-100 text-amber-800",
};

export default function ProfileHeader({ user }: { user: User }) {
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
      <Avatar name={user.fullName} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-ink">{user.fullName}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              ROLE_STYLES[user.role] ?? "bg-gray-100 text-gray-700"
            }`}
          >
            {user.role}
          </span>
        </div>
        <p className="truncate text-sm text-ink-soft">{user.email}</p>
        <p className="mt-1 text-xs text-gray-400">Member since {memberSince}</p>
      </div>
    </div>
  );
}
