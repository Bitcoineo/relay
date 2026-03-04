"use client";

import { useState } from "react";
import EmojiPicker from "./emoji-picker";

const INLINE_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀"];

interface MessageActionsProps {
  isOwnMessage: boolean;
  isPinned: boolean;
  canPin: boolean;
  onReply: () => void;
  onForward: () => void;
  onReact: (emoji: string) => void;
  onPin?: () => void;
  onDelete?: () => void;
}

export default function MessageActions({
  isOwnMessage,
  isPinned,
  canPin,
  onReply,
  onForward,
  onReact,
  onPin,
  onDelete,
}: MessageActionsProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="absolute -top-3 right-2 z-10 hidden items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-0.5 py-0.5 shadow-sm group-hover:flex">
      {/* Reply */}
      <button
        type="button"
        onClick={onReply}
        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        title="Reply"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      </button>

      {/* Inline quick reactions */}
      {INLINE_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onReact(emoji)}
          className="rounded px-0.5 py-0.5 text-sm leading-none transition-colors hover:bg-[var(--bg-secondary)]"
          title={emoji}
        >
          {emoji}
        </button>
      ))}

      {/* Full emoji picker trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          title="More reactions"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        {showPicker && (
          <EmojiPicker
            onSelect={(emoji) => {
              onReact(emoji);
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>

      {/* Forward */}
      <button
        type="button"
        onClick={onForward}
        className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
        title="Forward"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
        </svg>
      </button>

      {/* Pin */}
      {canPin && onPin && (
        <button
          type="button"
          onClick={onPin}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          title={isPinned ? "Unpin" : "Pin"}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v3.2c0 .28-.11.55-.3.75L5.4 11.6c-.5.53-.2 1.4.5 1.4h5.1v6l1 2 1-2v-6h5.1c.7 0 1-.87.5-1.4L15.3 7.95a1.06 1.06 0 01-.3-.75V4" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10" />
          </svg>
        </button>
      )}

      {/* Delete (own messages only) */}
      {isOwnMessage && onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="rounded p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--danger)]"
          title="Delete"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      )}
    </div>
  );
}
