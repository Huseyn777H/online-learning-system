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
      className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <ErrorMessage ref={errorRef} message={error} />
      <SuccessMessage message={success} />
      <div>
        <label htmlFor="profile-fullname" className="mb-1 block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          id="profile-fullname"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="profile-role" className="mb-1 block text-sm font-medium text-gray-700">
          Role
        </label>
        <input
          id="profile-role"
          type="text"
          value={user.role}
          disabled
          className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm capitalize text-gray-500"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
