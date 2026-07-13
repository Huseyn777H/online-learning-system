"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import type { Role } from "./types";

/**
 * Redirects to /login if not authenticated. If `roles` is provided, also
 * redirects away (to a sensible dashboard) when the user's role isn't allowed.
 */
export function useRequireAuth(roles?: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Callers typically pass an inline array literal, e.g. useRequireAuth(["student"]),
  // which is a new reference every render. Depending on `roles` directly would
  // re-run this effect (and re-evaluate the redirect logic) on every render of
  // the calling component. Depend on a stable, content-based key instead.
  const rolesKey = roles?.join(",") ?? "";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const allowed = rolesKey ? rolesKey.split(",") : [];
    if (allowed.length > 0 && !allowed.includes(user.role)) {
      router.replace(`/${user.role}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, rolesKey, router]);

  return { user, loading };
}
