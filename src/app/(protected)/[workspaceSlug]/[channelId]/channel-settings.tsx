"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ChannelSettingsProps {
  channel: {
    id: string;
    name: string;
    description: string | null;
    isDefault: boolean;
    archived: boolean;
  };
  workspaceSlug: string;
  isAdmin: boolean;
  isOwner: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ChannelSettings({
  channel,
  workspaceSlug,
  isAdmin,
  isOwner,
  onClose,
  onUpdate,
}: ChannelSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError("");

    const res = await fetch(
      `/api/workspaces/${workspaceSlug}/channels/${channel.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null }),
      }
    );

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update");
      setSaving(false);
      return;
    }

    setSaving(false);
    onUpdate();
  }

  async function handleSetDefault() {
    const res = await fetch(
      `/api/workspaces/${workspaceSlug}/channels/${channel.id}/default`,
      { method: "PATCH" }
    );
    if (res.ok) onUpdate();
  }

  async function handleToggleArchive() {
    const res = await fetch(
      `/api/workspaces/${workspaceSlug}/channels/${channel.id}/archive`,
      { method: "PATCH" }
    );
    if (res.ok) onUpdate();
  }

  async function handleDelete() {
    const res = await fetch(
      `/api/workspaces/${workspaceSlug}/channels/${channel.id}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      router.push(`/${workspaceSlug}`);
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[var(--overlay)]">
      <div className="w-full max-w-sm bg-[var(--bg-primary)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Channel Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Edit name/description */}
          {isAdmin && (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                  Channel name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-md border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}

          {/* Set default (owner only) */}
          {isOwner && !channel.isDefault && (
            <div className="border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={handleSetDefault}
                className="text-sm text-[var(--accent-text)] hover:underline"
              >
                Set as default channel
              </button>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                New members will automatically join this channel.
              </p>
            </div>
          )}

          {/* Archive/unarchive (admin+, not default) */}
          {isAdmin && !channel.isDefault && (
            <div className="border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={handleToggleArchive}
                className="text-sm text-[var(--warning)] hover:underline"
              >
                {channel.archived ? "Unarchive channel" : "Archive channel"}
              </button>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {channel.archived
                  ? "Restore this channel to active status."
                  : "Archived channels are read-only."}
              </p>
            </div>
          )}

          {/* Delete (admin+, not default) */}
          {isAdmin && !channel.isDefault && (
            <div className="border-t border-[var(--border)] pt-4">
              {!showDelete ? (
                <button
                  type="button"
                  onClick={() => setShowDelete(true)}
                  className="text-sm text-[var(--danger)] hover:underline"
                >
                  Delete channel
                </button>
              ) : (
                <div className="rounded-md border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-3">
                  <p className="text-sm font-medium text-[var(--danger)]">
                    Delete #{channel.name}?
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    All messages will be permanently lost.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="rounded-md bg-[var(--danger)] px-3 py-1.5 text-sm font-medium text-[var(--text-inverse)] hover:bg-[var(--danger-hover)]"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDelete(false)}
                      className="rounded-md px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
