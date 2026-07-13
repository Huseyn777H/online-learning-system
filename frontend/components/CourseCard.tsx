import Link from "next/link";
import type { Course } from "@/lib/types";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary-dark capitalize">
          {course.level}
        </span>
        {course.status !== "published" && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 capitalize">
            {course.status}
          </span>
        )}
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{course.title}</h3>
      <p className="line-clamp-3 text-sm text-gray-600">{course.description}</p>
    </Link>
  );
}
