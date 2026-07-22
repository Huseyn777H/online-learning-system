"use client";

import { useEffect, useRef, useState } from "react";
import { usersApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import ErrorMessage from "./ErrorMessage";
import SuccessMessage from "./SuccessMessage";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfileForm() {
  const { user, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  // useState's initial value only runs on mount, so if `user` becomes
  // available (or changes) after this component has already mounted, the
  // form fields wouldn't otherwise pick up the fresh values. Keep them
  // in sync explicitly.
  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName || !email) {
      setError("Please fill in all fields.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await usersApi.updateProfile({ fullName, email });
      await refreshProfile();
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-soft"
    >
      <ErrorMessage ref={errorRef} message={error} />
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="profile-fullname" className="mb-1.5 block text-sm font-medium text-ink">
          Full name
        </label>
        <input
          id="profile-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
