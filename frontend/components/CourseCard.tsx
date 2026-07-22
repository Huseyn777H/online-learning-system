import Link from "next/link";
import type { Course } from "@/lib/types";

const COVER_GRADIENTS = [
  "from-indigo-500 to-violet-500",
  "from-sky-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
  "from-rose-500 to-pink-500",
  "from-fuchsia-500 to-purple-500",
];

const LEVEL_STYLES: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-800",
  intermediate: "bg-amber-100 text-amber-800",
  advanced: "bg-rose-100 text-rose-800",
};

function gradientFor(seed: number | string): string {
  const key = String(seed);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length];
}

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
    >
      <div className={`flex h-24 items-end bg-gradient-to-br p-4 ${gradientFor(course.categoryId ?? course.id)}`}>
        <span className="rounded-full bg-white/25 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm capitalize">
          {course.level}
        </span>
      </div>
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${LEVEL_STYLES[course.level] ?? "bg-gray-100 text-gray-700"}`}>
            {course.level}
          </span>
          {course.status !== "published" && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 capitalize">
              {course.status}
            </span>
          )}
        </div>
        <h3 className="mb-1 text-lg font-semibold text-ink transition group-hover:text-primary">{course.title}</h3>
        <p className="line-clamp-3 text-sm text-ink-soft">{course.description}</p>
      </div>
    </Link>
  );
}
