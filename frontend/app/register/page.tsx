"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import type { Role } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// bcrypt (used by the backend) only hashes the first 72 bytes of a password;
// anything longer is silently truncated, so two different passwords sharing
// a 72-char prefix would both validate. Mirror the backend's Pydantic
// max_length=72 constraint here so users get a clear message up front.
const MAX_PASSWORD_LENGTH = 72;

const ROLES: { value: Role; label: string; blurb: string }[] = [
  { value: "student", label: "Student", blurb: "I want to take courses" },
  { value: "teacher", label: "Teacher", blurb: "I want to create courses" },
];

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
    <AuthShell title="Create your account" subtitle="Join thousands of learners and instructors.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage ref={errorRef} message={error} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">I am a...</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                aria-pressed={role === r.value}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  role === r.value
                    ? "border-primary bg-primary-light/60 ring-1 ring-primary"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className={`block font-medium ${role === r.value ? "text-primary-dark" : "text-ink"}`}>
                  {r.label}
                </span>
                <span className="block text-xs text-ink-soft">{r.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="register-fullname" className="mb-1.5 block text-sm font-medium text-ink">
            Full name
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <UserIcon />
            </span>
            <input
              id="register-fullname"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              placeholder="Jane Doe"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <MailIcon />
            </span>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <PasswordInput
            id="register-password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            maxLength={MAX_PASSWORD_LENGTH}
          />
          <PasswordStrengthMeter password={password} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white shadow-soft transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Creating account..." : "Create account"}
        </button>
        <p className="text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path d="M3 4a2 2 0 00-2 2v.01L10 12l9-5.99V6a2 2 0 00-2-2H3z" />
      <path d="M18 8.118l-8 5.334-8-5.334V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
