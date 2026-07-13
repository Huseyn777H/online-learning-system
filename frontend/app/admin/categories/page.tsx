"use client";

import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { categoriesApi, ApiError } from "@/lib/api";
import type { Category } from "@/lib/types";
import Spinner from "@/components/Spinner";
import ErrorMessage from "@/components/ErrorMessage";
import SuccessMessage from "@/components/SuccessMessage";

export default function AdminCategoriesPage() {
  const { user, loading: authLoading } = useRequireAuth(["admin"]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const [editing, setEditing] = useState<Record<number, { name: string; description: string }>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  function load() {
    setLoading(true);
    categoriesApi
      .list()
      .then(setCategories)
      .catch((err) => setError(err.message || "Failed to load categories"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!name || !description) {
      setError("Please fill in both fields.");
      return;
    }
    setCreating(true);
    try {
      await categoriesApi.create({ name, description });
      setName("");
      setDescription("");
      setMessage("Category created.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  async function handleUpdate(id: number) {
    const edit = editing[id];
    if (!edit) return;
    setSavingId(id);
    setError(null);
    setMessage(null);
    try {
      await categoriesApi.update(id, edit);
      setMessage("Category updated.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update category.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    setSavingId(id);
    setError(null);
    setMessage(null);
    try {
      await categoriesApi.remove(id);
      setMessage("Category deleted.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete category.");
    } finally {
      setSavingId(null);
    }
  }

  if (authLoading || !user) return <Spinner />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Categories</h1>

      <div className="mb-8 rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-gray-900">New Category</h2>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Name"
            aria-label="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-w-[160px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="Description"
            aria-label="Category description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-w-[240px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {creating ? "Creating..." : "Add"}
          </button>
        </form>
      </div>

      <ErrorMessage message={error} />
      <SuccessMessage message={message} />

      {loading && <Spinner label="Loading categories..." />}

      {!loading && categories.length === 0 && (
        <p className="text-gray-500">No categories yet.</p>
      )}

      <div className="space-y-3">
        {categories.map((c) => {
          const edit = editing[c.id] ?? { name: c.name, description: c.description };
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-4">
              <input
                type="text"
                aria-label={`Name for category ${c.name}`}
                value={edit.name}
                onChange={(e) =>
                  setEditing((m) => ({ ...m, [c.id]: { ...edit, name: e.target.value } }))
                }
                className="min-w-[140px] rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                aria-label={`Description for category ${c.name}`}
                value={edit.description}
                onChange={(e) =>
                  setEditing((m) => ({ ...m, [c.id]: { ...edit, description: e.target.value } }))
                }
                className="min-w-[220px] flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleUpdate(c.id)}
                disabled={savingId === c.id}
                className="rounded-md border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-light disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                disabled={savingId === c.id}
                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
