"use client";

import type { Message } from "./chat-types";
import { getUserColor, getUserName, formatTime } from "./chat-types";

interface PinnedMessagesPanelProps {
  pinnedMessages: Message[];
  canPin: boolean;
  onUnpin: (messageId: string) => void;
  onClose: () => void;
}

export default function PinnedMessagesPanel({
  pinnedMessages,
  canPin,
  onUnpin,
  onClose,
}: PinnedMessagesPanelProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/30"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-sm flex-col bg-[var(--bg-primary)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Pinned messages
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {pinnedMessages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <svg className="h-10 w-10 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v3.2c0 .28-.11.55-.3.75L5.4 11.6c-.5.53-.2 1.4.5 1.4h5.1v6l1 2 1-2v-6h5.1c.7 0 1-.87.5-1.4L15.3 7.95a1.06 1.06 0 01-.3-.75V4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10" />
              </svg>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                No pinned messages in this channel.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
                >
                  <div className="flex items-center gap-2">
                    {msg.user.profileImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={msg.user.profileImage}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium text-white"
                        style={{ backgroundColor: getUserColor(msg.user) }}
                      >
                        {getUserName(msg.user)[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {getUserName(msg.user)}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-[15px] text-[var(--text-secondary)]">
                    {msg.content}
                  </p>
                  {msg.pinnedBy && (
                    <p className="mt-1.5 text-xs text-[var(--text-muted)]">
                      Pinned by {msg.pinnedBy.name || "Unknown"}
                    </p>
                  )}
                  {canPin && (
                    <button
                      type="button"
                      onClick={() => onUnpin(msg.id)}
                      className="mt-2 text-xs font-medium text-[var(--danger)] transition-colors hover:text-[var(--danger)]/80"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
