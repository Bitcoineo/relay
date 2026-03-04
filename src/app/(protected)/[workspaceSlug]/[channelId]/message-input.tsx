"use client";

import { useState, useRef } from "react";
import type { Socket } from "socket.io-client";
import EmojiPicker from "./emoji-picker";
import {
  type Message,
  type MemberInfo,
  getUserColor,
  getUserName,
} from "./chat-types";

interface MessageInputProps {
  channelName: string;
  channelId: string;
  socket: Socket | null;
  replyTo: Message | null;
  onCancelReply: () => void;
  onMessageSent: () => void;
  members: MemberInfo[];
  currentUserId: string;
}

export default function MessageInput({
  channelName,
  channelId,
  socket,
  replyTo,
  onCancelReply,
  onMessageSent,
  members,
  currentUserId,
}: MessageInputProps) {
  const [input, setInput] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const filteredMembers = mentionQuery
    ? members.filter(
        (m) =>
          m.id !== currentUserId &&
          getUserName(m).toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : members.filter((m) => m.id !== currentUserId);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !socket) return;

    socket.emit("send_message", {
      channelId,
      content: trimmed,
      replyToId: replyTo?.id,
    });
    setInput("");
    setShowMentions(false);
    onMessageSent();

    if (inputRef.current) inputRef.current.style.height = "auto";

    if (isTypingRef.current) {
      socket.emit("typing_stop", channelId);
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setInput(value);

    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";

    const cursorPos = e.target.selectionStart || value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt =
        lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : " ";
      if (charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!/\s/.test(query)) {
          setMentionQuery(query);
          setShowMentions(true);
          setMentionIndex(0);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }

    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing_start", channelId);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("typing_stop", channelId);
      }
    }, 2000);
  }

  function selectMention(member: MemberInfo) {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = input.slice(cursorPos);

    setInput(
      input.slice(0, lastAtIndex) +
        `@${getUserName(member)} ` +
        textAfterCursor
    );
    setShowMentions(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend(e);
      return;
    }

    if (!showMentions || filteredMembers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionIndex((prev) =>
        prev < filteredMembers.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredMembers.length - 1
      );
    } else if (e.key === "Enter" && showMentions) {
      e.preventDefault();
      selectMention(filteredMembers[mentionIndex]);
    } else if (e.key === "Escape") {
      setShowMentions(false);
    }
  }

  return (
    <div className="relative bg-white px-4 py-3">
      {/* Reply banner */}
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-md border border-[#EEEEED] bg-[#F8F8F7] px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
            <svg
              className="h-3.5 w-3.5 text-[#A3A3A3]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
            <span>
              Replying to{" "}
              <span className="font-medium">{getUserName(replyTo.user)}</span>
            </span>
            <span className="truncate text-[#A3A3A3]">
              {replyTo.content.slice(0, 60)}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded p-0.5 text-[#A3A3A3] hover:text-[#2D2D2D]"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Mention autocomplete dropdown */}
      {showMentions && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 mb-1 max-h-48 overflow-y-auto rounded-md border border-[#EEEEED] bg-white shadow-lg">
          {filteredMembers.slice(0, 8).map((member, i) => (
            <button
              key={member.id}
              type="button"
              onClick={() => selectMention(member)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === mentionIndex
                  ? "bg-[#4F46E5] text-white"
                  : "text-[#2D2D2D] hover:bg-[#F8F8F7]"
              }`}
            >
              <div
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: getUserColor(member) }}
              >
                {getUserName(member)[0].toUpperCase()}
              </div>
              <span className="truncate">{getUserName(member)}</span>
              <span
                className={`ml-auto text-xs ${
                  i === mentionIndex ? "text-white/70" : "text-[#A3A3A3]"
                }`}
              >
                {member.email}
              </span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSend}>
        <div className="flex items-end gap-2 rounded-lg border border-[#EEEEED] bg-white px-4 py-3 shadow-sm transition-shadow focus-within:border-[#4F46E5] focus-within:shadow-md focus-within:ring-1 focus-within:ring-[#4F46E5]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={`Message #${channelName}`}
            rows={1}
            className="flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-[#2D2D2D] placeholder-[#A3A3A3] focus:outline-none"
            style={{ maxHeight: "120px" }}
          />
          {/* Emoji button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="rounded p-1 text-[#A3A3A3] transition-colors hover:text-[#2D2D2D]"
              title="Emoji"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z"
                />
              </svg>
            </button>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={(emoji) => {
                  setInput((prev) => prev + emoji);
                  inputRef.current?.focus();
                }}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
