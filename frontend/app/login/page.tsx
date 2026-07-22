"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { ApiError } from "@/lib/api";
import ErrorMessage from "@/components/ErrorMessage";
import AuthShell from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(`/${user.role}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your learning journey.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorMessage ref={errorRef} message={error} />
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <MailIcon />
            </span>
            <input
              id="login-email"
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
          <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <PasswordInput id="login-password" value={password} onChange={setPassword} autoComplete="current-password" />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-white shadow-soft transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? "Logging in..." : "Log in"}
        </button>
        <p className="text-center text-sm text-ink-soft">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
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

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
