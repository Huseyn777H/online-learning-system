"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import type { Role } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// bcrypt (used by the backend) only hashes the first 72 bytes of a password;
// anything longer is silently truncated, so two different passwords sharing
// a 72-char prefix would both validate. Mirror the backend's Pydantic
// max_length=72 constraint here so users get a clear message up front.
const MAX_PASSWORD_LENGTH = 72;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setError(`Password must be at most ${MAX_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    try {
      const user = await register(fullName, email, password, role);
      router.push(`/${user.role}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <ErrorMessage ref={errorRef} message={error} />
        <div>
          <label htmlFor="register-fullname" className="mb-1 block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="register-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={MAX_PASSWORD_LENGTH}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label htmlFor="register-role" className="mb-1 block text-sm font-medium text-gray-700">
            I am a...
          </label>
          <select
            id="register-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Register"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
