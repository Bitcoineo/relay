"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
  profileImage: string | null;
  status: string;
}

interface DmPickerProps {
  workspaceSlug: string;
  currentUserId: string;
  onClose: () => void;
}

export default function DmPicker({
  workspaceSlug,
  currentUserId,
  onClose,
}: DmPickerProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceSlug}/members`)
      .then((r) => r.json())
      .then((data) => {
        const mapped = data
          .map((m: { user: Member }) => m.user)
          .filter((u: Member) => u.id !== currentUserId);
        setMembers(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [workspaceSlug, currentUserId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const filtered = members.filter((m) => {
    const name = m.name || m.email.split("@")[0];
    return name.toLowerCase().includes(search.toLowerCase());
  });

  async function handleSelect(userId: string) {
    if (creating) return;
    setCreating(true);

    const res = await fetch(`/api/workspaces/${workspaceSlug}/dm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (res.ok) {
      const { channelId } = await res.json();
      onClose();
      router.push(`/${workspaceSlug}/${channelId}`);
      router.refresh();
    }

    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]">
      <div
        ref={ref}
        className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xl"
      >
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          New direct message
        </h3>

        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="mt-3 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />

        <div className="mt-3 max-h-64 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-4">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="py-3 text-center text-sm text-[var(--text-muted)]">
              No members found
            </p>
          )}

          {filtered.map((member) => {
            const displayName = member.name || member.email.split("@")[0];
            const statusColor =
              member.status === "online"
                ? "bg-[var(--success)]"
                : member.status === "idle"
                  ? "bg-[var(--warning)]"
                  : "bg-[var(--border-strong)]";

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect(member.id)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                <div className="relative flex-shrink-0">
                  {member.profileImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={member.profileImage}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
                      style={{
                        backgroundColor: member.avatarColor || "#0D9488",
                      }}
                    >
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-px -right-px h-2 w-2 rounded-full border border-[var(--status-dot-border)] ${statusColor}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {member.email}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--border)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
