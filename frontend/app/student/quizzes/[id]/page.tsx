"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { quizzesApi, ApiError } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function TakeQuizPage() {
  const { user, loading: authLoading } = useRequireAuth(["student"]);
  const params = useParams();
  const quizId = Number(params.id);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(quizId)) {
      setError("Invalid quiz link.");
      setLoading(false);
      return;
    }
    quizzesApi
      .get(quizId)
      .then(setQuiz)
      .catch((err) => setError(err.message || "Failed to load quiz"))
      .finally(() => setLoading(false));
  }, [user, quizId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quiz) return;
    setError(null);
    const missing = quiz.questions?.some((q) => !answers[q.id]);
    if (missing) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const attempt = await quizzesApi.submit(quizId, {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: Number(questionId),
          answer,
        })),
      });
      setResult(attempt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading quiz..." />;
  if (error && !quiz) return <ErrorMessage message={error} />;
  if (!quiz) return <ErrorMessage message="Quiz not found." />;

  if (result) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-gray-200 bg-white p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Quiz Submitted</h1>
        <p className="mb-4 text-gray-600">Your score: {result.score}</p>
        <span
          className={`inline-block rounded-full px-4 py-2 font-medium ${
            result.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {result.passed ? "Passed" : "Not passed"}
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">{quiz.title}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {quiz.description} &middot; Passing score: {quiz.passingScore}
        {quiz.timeLimit ? ` · Time limit: ${quiz.timeLimit} min` : ""}
      </p>

      <ErrorMessage message={error} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {quiz.questions?.map((q, idx) => (
          <div key={q.id} className="rounded-lg border border-gray-200 bg-white p-5">
            <p className="mb-3 font-medium text-gray-900">
              {idx + 1}. {q.questionText}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}

        {(!quiz.questions || quiz.questions.length === 0) && (
          <p className="text-gray-500">This quiz has no questions yet.</p>
        )}

        {quiz.questions && quiz.questions.length > 0 && (
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </button>
        )}
      </form>
    </div>
  );
}
