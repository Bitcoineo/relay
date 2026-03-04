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
  owner: "bg-[#2D2D2D] text-white",
  admin: "bg-[#F8F8F7] text-[#2D2D2D] border border-[#EEEEED]",
  member: "bg-[#F8F8F7] text-[#6B6B6B]",
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
      setError(data.error || "Failed to create workspace");
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white">
          <svg
            className="h-8 w-8 text-[#6B6B6B]"
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
        <h2 className="mt-4 text-lg font-semibold text-[#2D2D2D]">
          No workspaces yet
        </h2>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          A workspace is where your team lives. Start one.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97]"
        >
          Create workspace
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#2D2D2D]">Workspaces</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97]"
          >
            New workspace
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-4 flex items-end gap-3 rounded-md border border-[#EEEEED] bg-white p-4"
        >
          <div className="flex-1">
            <label
              htmlFor="workspace-name"
              className="block text-sm font-medium text-[#2D2D2D]"
            >
              Name
            </label>
            <input
              id="workspace-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-[#EEEEED] px-3 py-2.5 text-sm text-[#2D2D2D] transition-all duration-150 focus:border-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              placeholder="e.g. Marketing, Engineering"
              autoFocus
            />
            {error && <p className="mt-1 text-sm text-[#EB5757]">{error}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97] disabled:opacity-50"
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
            className="rounded-md border border-[#EEEEED] px-4 py-2.5 text-sm text-[#6B6B6B] transition-all duration-150 hover:bg-[#F8F8F7] hover:shadow-sm active:scale-[0.97]"
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
            className="animate-fadeInUp group rounded-md border border-[#EEEEED] bg-white p-6 shadow-sm transition-all duration-150 hover:bg-[#F8F8F7] hover:shadow-md hover:-translate-y-0.5 hover:border-[#D3D1CB]"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-medium text-[#2D2D2D]">
                {ws.name}
              </h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[ws.role] || ROLE_STYLES.member}`}
              >
                {ws.role}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[#A3A3A3]">/{ws.slug}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
