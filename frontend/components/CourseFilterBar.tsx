"use client";

import { useEffect, useState } from "react";
import { categoriesApi } from "@/lib/api";
import type { Category } from "@/lib/types";

export interface CourseFilters {
  keyword: string;
  category: string;
  level: string;
}

export default function CourseFilterBar({
  filters,
  onChange,
}: {
  filters: CourseFilters;
  onChange: (filters: CourseFilters) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState(filters.keyword);

  useEffect(() => {
    categoriesApi
      .list()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onChange({ ...filters, keyword });
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="filter-keyword" className="mb-1 block text-xs font-medium text-gray-600">
          Keyword
        </label>
        <input
          id="filter-keyword"
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search courses..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="min-w-[160px]">
        <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-gray-600">
          Category
        </label>
        <select
          id="filter-category"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-[160px]">
        <label htmlFor="filter-level" className="mb-1 block text-xs font-medium text-gray-600">
          Level
        </label>
        <select
          id="filter-level"
          value={filters.level}
          onChange={(e) => onChange({ ...filters, level: e.target.value })}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Search
      </button>
    </form>
  );
}
