"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { coursesApi, quizzesApi, ApiError } from "@/lib/api";
import type { Course, Quiz } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function QuizBuilderPage() {
  const { user, loading: authLoading } = useRequireAuth(["teacher"]);
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [passingScore, setPassingScore] = useState("60");
  const [timeLimit, setTimeLimit] = useState("");
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [score, setScore] = useState("10");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionMessage, setQuestionMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    if (Number.isNaN(courseId)) {
      setError("Invalid course link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    Promise.all([coursesApi.get(courseId), quizzesApi.listByCourse(courseId)])
      .then(([c, quizzes]) => {
        if (cancelled) return;
        setCourse(c);
        // A course can only sensibly have one quiz in this UI's flow — load
        // the existing one instead of always showing the "Create Quiz" form,
        // otherwise a returning teacher would create a second, orphaned quiz.
        if (quizzes.length > 0) setQuiz(quizzes[0]);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load course");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, courseId]);

  async function handleCreateQuiz(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!quizTitle || !quizDescription || !passingScore) {
      setError("Please fill in all quiz fields.");
      return;
    }
    if (!(Number(passingScore) > 0)) {
      setError("Passing score must be a positive number.");
      return;
    }
    if (timeLimit && !(Number(timeLimit) > 0)) {
      setError("Time limit must be a positive number of minutes.");
      return;
    }
    setCreatingQuiz(true);
    try {
      const newQuiz = await quizzesApi.create({
        courseId,
        title: quizTitle,
        description: quizDescription,
        passingScore: Number(passingScore),
        timeLimit: timeLimit ? Number(timeLimit) : null,
      });
      setQuiz(newQuiz);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create quiz.");
    } finally {
      setCreatingQuiz(false);
    }
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setQuestionMessage(null);
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!questionText || cleanOptions.length < 2 || !correctAnswer || !score) {
      setQuestionMessage({
        ok: false,
        text: "Please fill in the question, at least 2 options, correct answer, and score.",
      });
      return;
    }
    if (!cleanOptions.includes(correctAnswer)) {
      setQuestionMessage({ ok: false, text: "Correct answer must match one of the options exactly." });
      return;
    }
    if (!(Number(score) > 0)) {
      setQuestionMessage({ ok: false, text: "Score must be a positive number." });
      return;
    }
    if (!quiz) return;
    setAddingQuestion(true);
    try {
      const q = await quizzesApi.addQuestion(quiz.id, {
        questionText,
        options: cleanOptions,
        correctAnswer,
        score: Number(score),
      });
      setQuiz((prev) => (prev ? { ...prev, questions: [...(prev.questions ?? []), q] } : prev));
      setQuestionText("");
      setOptions(["", ""]);
      setCorrectAnswer("");
      setScore("10");
      setQuestionMessage({ ok: true, text: "Question added." });
    } catch (err) {
      setQuestionMessage({
        ok: false,
        text: err instanceof ApiError ? err.message : "Failed to add question.",
      });
    } finally {
      setAddingQuestion(false);
    }
  }

  if (authLoading || !user) return <Spinner />;
  if (loading) return <Spinner label="Loading..." />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Quiz Builder</h1>
      <p className="mb-6 text-sm text-gray-500">{course?.title}</p>

      <ErrorMessage message={error} />

      {!quiz ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Create Quiz</h2>
          <form onSubmit={handleCreateQuiz} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Quiz title"
              aria-label="Quiz title"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-2"
            />
            <textarea
              placeholder="Description"
              aria-label="Quiz description"
              value={quizDescription}
              onChange={(e) => setQuizDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none sm:col-span-2"
            />
            <div>
              <label htmlFor="quiz-passing-score" className="mb-1 block text-xs text-gray-500">
                Passing score
              </label>
              <input
                id="quiz-passing-score"
                type="number"
                min={1}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="quiz-time-limit" className="mb-1 block text-xs text-gray-500">
                Time limit (minutes, optional)
              </label>
              <input
                id="quiz-time-limit"
                type="number"
                min={1}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={creatingQuiz}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60 sm:col-span-2"
            >
              {creatingQuiz ? "Creating..." : "Create Quiz"}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-gray-900">{quiz.title}</h2>
            <p className="text-sm text-gray-600">{quiz.description}</p>
            <p className="mt-1 text-xs text-gray-400">
              Passing score: {quiz.passingScore} &middot; Time limit:{" "}
              {quiz.timeLimit ? `${quiz.timeLimit} min` : "None"}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 font-semibold text-gray-900">Questions</h3>
            {quiz.questions && quiz.questions.length > 0 ? (
              <ul className="mb-4 space-y-2">
                {quiz.questions.map((q) => (
                  <li key={q.id} className="rounded-md border border-gray-100 p-3 text-sm">
                    <p className="font-medium text-gray-800">{q.questionText}</p>
                    <p className="text-xs text-gray-500">
                      Options: {q.options.join(", ")} &middot; Score: {q.score}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-4 text-sm text-gray-400">No questions yet.</p>
            )}

            <form onSubmit={handleAddQuestion} className="space-y-2 border-t border-gray-100 pt-4">
              <input
                type="text"
                placeholder="Question text"
                aria-label="Question text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {options.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  aria-label={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...options];
                    next[idx] = e.target.value;
                    setOptions(next);
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              ))}
              <button
                type="button"
                onClick={() => setOptions((o) => [...o, ""])}
                className="text-xs font-medium text-primary hover:underline"
              >
                + Add another option
              </button>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="question-correct-answer" className="mb-1 block text-xs text-gray-500">
                    Correct answer (exact match)
                  </label>
                  <input
                    id="question-correct-answer"
                    type="text"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="question-score" className="mb-1 block text-xs text-gray-500">
                    Score
                  </label>
                  <input
                    id="question-score"
                    type="number"
                    min={1}
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={addingQuestion}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
              >
                {addingQuestion ? "Adding..." : "Add Question"}
              </button>
              {questionMessage &&
                (questionMessage.ok ? (
                  <SuccessMessage message={questionMessage.text} />
                ) : (
                  <ErrorMessage message={questionMessage.text} />
                ))}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
