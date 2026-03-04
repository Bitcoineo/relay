"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
  createdAt: string;
  ownerId: string;
}

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-[var(--bg-inverse)] text-[var(--text-inverse)]",
  admin: "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]",
  member: "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
};

export default function WorkspaceList({
  initialWorkspaces,
}: {
  initialWorkspaces: Workspace[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    setName("");
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  if (initialWorkspaces.length === 0 && !showForm) {
    return (
      <div className="mt-16 animate-fadeInUp text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-primary)]">
          <svg
            className="h-8 w-8 text-[var(--text-secondary)]"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-[var(--text-primary)]">
          No workspaces yet
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          No workspaces yet. Create one and invite your team.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
        >
          Create workspace
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Workspaces</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
          >
            Create workspace
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex items-end gap-3 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] p-4"
        >
          <div className="flex-1">
            <label
              htmlFor="workspace-name"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Name
            </label>
            <input
              id="workspace-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-all duration-150 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="e.g. Marketing, Engineering"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setError("");
              setName("");
            }}
            className="rounded-full border border-[var(--border)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:scale-[1.01] hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97]"
          >
            Cancel
          </button>
        </form>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {initialWorkspaces.map((ws, i) => (
          <Link
            key={ws.id}
            href={`/${ws.slug}`}
            className="animate-fadeInUp group rounded-md border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-150 hover:bg-[var(--bg-secondary)] hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-medium text-[var(--text-primary)]">
                {ws.name}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[ws.role] || ROLE_STYLES.member}`}
              >
                {ws.role}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--text-muted)]">/{ws.slug}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
