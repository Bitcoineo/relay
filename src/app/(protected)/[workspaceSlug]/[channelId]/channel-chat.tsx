"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../socket-provider";
import { useRouter } from "next/navigation";
import MessageActions from "./message-actions";
import EmojiPicker from "./emoji-picker";
import ForwardModal from "./forward-modal";
import ChannelSettings from "./channel-settings";
import ProfilePopup from "./profile-popup";

// ─── Types ───────────────────────────────────────────────────────────

interface MessageUser {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
  profileImage?: string | null;
}

interface ReactionData {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; name: string | null };
}

interface Message {
  id: string;
  channelId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: MessageUser;
  replyTo?: {
    id: string;
    content: string;
    user: { id: string; name: string | null };
  } | null;
  forwardedFromChannel?: { id: string; name: string } | null;
  forwardedFromUser?: { id: string; name: string | null } | null;
  reactions?: ReactionData[];
}

interface MemberInfo {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
  status: string;
}

interface ChannelChatProps {
  channelId: string;
  channelName: string;
  channelDescription: string | null;
  workspaceSlug: string;
  currentUserId: string;
  members: MemberInfo[];
  isArchived?: boolean;
  isAdmin?: boolean;
  isOwner?: boolean;
  isDefault?: boolean;
  channels?: Array<{ id: string; name: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#4F46E5",
  "#0891B2",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#DB2777",
  "#2563EB",
];

function getUserColor(user: MessageUser | MemberInfo): string {
  return (
    user.avatarColor ||
    AVATAR_COLORS[hashCode(user.id) % AVATAR_COLORS.length]
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getUserName(user: MessageUser | MemberInfo | { id: string; name: string | null }): string {
  if ("email" in user) {
    return user.name || user.email.split("@")[0];
  }
  return user.name || "Unknown";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatFullDate(iso);
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function shouldGroup(prev: Message, curr: Message): boolean {
  if (prev.userId !== curr.userId) return false;
  const diff =
    new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return Math.abs(diff) < 5 * 60 * 1000;
}

/** Render message content with @mention pills */
function renderContent(content: string, members: MemberInfo[]) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1).toLowerCase();
      const member = members.find(
        (m) => getUserName(m).toLowerCase() === name
      );
      if (member) {
        return (
          <span
            key={i}
            className="rounded px-1 py-0.5 font-medium"
            style={{
              backgroundColor: `${getUserColor(member)}1A`,
              color: getUserColor(member),
            }}
          >
            {part}
          </span>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

/** Group reactions by emoji → { emoji, count, users, userReacted } */
function groupReactions(
  reactions: ReactionData[],
  currentUserId: string
): Array<{
  emoji: string;
  count: number;
  userReacted: boolean;
  users: string[];
}> {
  const map = new Map<
    string,
    { count: number; userReacted: boolean; users: string[] }
  >();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(r.user.name || "Unknown");
      if (r.userId === currentUserId) existing.userReacted = true;
    } else {
      map.set(r.emoji, {
        count: 1,
        userReacted: r.userId === currentUserId,
        users: [r.user.name || "Unknown"],
      });
    }
  }
  return Array.from(map.entries()).map(([emoji, data]) => ({
    emoji,
    ...data,
  }));
}

// ─── Component ───────────────────────────────────────────────────────

export default function ChannelChat({
  channelId,
  channelName,
  channelDescription,
  workspaceSlug,
  currentUserId,
  members,
  isArchived = false,
  isAdmin = false,
  isOwner = false,
  isDefault = false,
  channels = [],
}: ChannelChatProps) {
  const socket = useSocket();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { userName: string; timeout: NodeJS.Timeout }>
  >(new Map());

  // Reply state
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Forward modal state
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Channel settings panel
  const [showSettings, setShowSettings] = useState(false);

  // Profile popup
  const [profilePopup, setProfilePopup] = useState<{
    userId: string;
    avatarColor: string;
    userName: string;
    status: string;
    position: { top: number; left: number };
  } | null>(null);

  // Presence tracking: userId → status
  const [presenceMap, setPresenceMap] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.status));
    return map;
  });

  function getMemberStatus(userId: string): string {
    return presenceMap.get(userId) || "offline";
  }

  const onlineInChannel = members.filter(
    (m) => getMemberStatus(m.id) === "online"
  ).length;

  // Mention autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filtered members for autocomplete
  const filteredMembers = mentionQuery
    ? members.filter(
        (m) =>
          m.id !== currentUserId &&
          getUserName(m).toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : members.filter((m) => m.id !== currentUserId);

  // ─── Fetch messages from API ────────────────────────────────────

  const fetchMessages = useCallback(
    async (cursor?: string) => {
      const params = new URLSearchParams({ limit: "50" });
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(
        `/api/workspaces/${workspaceSlug}/channels/${channelId}/messages?${params}`
      );
      if (!res.ok) return null;
      return res.json() as Promise<{
        messages: Message[];
        nextCursor: string | null;
      }>;
    },
    [workspaceSlug, channelId]
  );

  // ─── Initial load + Socket.io setup ─────────────────────────────

  useEffect(() => {
    let mounted = true;

    fetchMessages().then((data) => {
      if (!mounted || !data) return;
      setMessages(data.messages.reverse());
      setNextCursor(data.nextCursor);
      setInitialLoad(false);

      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView();
      });
    });

    if (socket) {
      socket.emit("join_channel", channelId);

      const handleNewMessage = (msg: Message) => {
        if (msg.channelId !== channelId) return;
        setMessages((prev) => [...prev, msg]);

        requestAnimationFrame(() => {
          const container = scrollContainerRef.current;
          if (container) {
            const atBottom =
              container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
              100;
            if (atBottom) {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
              setHasNewBelow(true);
            }
          }
        });
      };

      const handleTyping = (data: {
        channelId: string;
        userId: string;
        userName: string;
      }) => {
        if (data.channelId !== channelId || data.userId === currentUserId)
          return;

        setTypingUsers((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.userId);
          if (existing) clearTimeout(existing.timeout);

          const timeout = setTimeout(() => {
            setTypingUsers((p) => {
              const n = new Map(p);
              n.delete(data.userId);
              return n;
            });
          }, 3000);

          next.set(data.userId, { userName: data.userName, timeout });
          return next;
        });
      };

      const handleStopTyping = (data: {
        channelId: string;
        userId: string;
      }) => {
        if (data.channelId !== channelId) return;
        setTypingUsers((prev) => {
          const next = new Map(prev);
          const existing = next.get(data.userId);
          if (existing) clearTimeout(existing.timeout);
          next.delete(data.userId);
          return next;
        });
      };

      const handlePresence = (data: { userId: string; status: string }) => {
        setPresenceMap((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.status);
          return next;
        });
      };

      const handleReactionUpdate = (data: {
        messageId: string;
        emoji: string;
        userId: string;
        userName: string;
        action: "added" | "removed";
      }) => {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== data.messageId) return msg;
            const reactions = [...(msg.reactions || [])];
            if (data.action === "added") {
              reactions.push({
                id: `${data.messageId}-${data.userId}-${data.emoji}`,
                emoji: data.emoji,
                userId: data.userId,
                user: { id: data.userId, name: data.userName },
              });
            } else {
              const idx = reactions.findIndex(
                (r) => r.userId === data.userId && r.emoji === data.emoji
              );
              if (idx !== -1) reactions.splice(idx, 1);
            }
            return { ...msg, reactions };
          })
        );
      };

      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleTyping);
      socket.on("user_stop_typing", handleStopTyping);
      socket.on("presence_update", handlePresence);
      socket.on("reaction_update", handleReactionUpdate);

      return () => {
        mounted = false;
        socket.emit("leave_channel", channelId);
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleTyping);
        socket.off("user_stop_typing", handleStopTyping);
        socket.off("presence_update", handlePresence);
        socket.off("reaction_update", handleReactionUpdate);
      };
    }

    return () => {
      mounted = false;
    };
  }, [socket, channelId, fetchMessages, currentUserId]);

  // ─── Infinite scroll ────────────────────────────────────────────

  const loadOlderMessages = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    const data = await fetchMessages(nextCursor);
    if (data) {
      setMessages((prev) => [...data.messages.reverse(), ...prev]);
      setNextCursor(data.nextCursor);

      requestAnimationFrame(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - prevScrollHeight;
        }
      });
    }

    setLoadingOlder(false);
  }, [nextCursor, loadingOlder, fetchMessages]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 100 && nextCursor && !loadingOlder) {
      loadOlderMessages();
    }
    const atBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      50;
    if (atBottom && hasNewBelow) {
      setHasNewBelow(false);
    }
  }, [nextCursor, loadingOlder, loadOlderMessages, hasNewBelow]);

  // ─── Send message ───────────────────────────────────────────────

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !socket || isArchived) return;

    socket.emit("send_message", {
      channelId,
      content: trimmed,
      replyToId: replyTo?.id,
    });
    setInput("");
    setReplyTo(null);
    setShowMentions(false);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    if (isTypingRef.current) {
      socket.emit("typing_stop", channelId);
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }

  // ─── Input change + mention detection ───────────────────────────

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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socket.emit("typing_stop", channelId);
      }
    }, 2000);
  }

  // ─── Mention selection ──────────────────────────────────────────

  function selectMention(member: MemberInfo) {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const textBeforeCursor = input.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const textAfterCursor = input.slice(cursorPos);

    const newInput =
      input.slice(0, lastAtIndex) +
      `@${getUserName(member)} ` +
      textAfterCursor;

    setInput(newInput);
    setShowMentions(false);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
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

  // ─── Reaction handler ──────────────────────────────────────────

  function handleReact(messageId: string, emoji: string) {
    if (!socket) return;
    socket.emit("send_reaction", { channelId, messageId, emoji });
  }

  // ─── Delete handler ────────────────────────────────────────────

  function handleDelete(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    // Also emit delete via socket if needed
    if (socket) {
      socket.emit("delete_message", { channelId, messageId });
    }
  }

  // ─── Avatar click → profile popup ─────────────────────────────

  function handleAvatarClick(
    e: React.MouseEvent,
    user: MessageUser,
    status: string
  ) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setProfilePopup({
      userId: user.id,
      avatarColor: getUserColor(user),
      userName: getUserName(user),
      status,
      position: { top: rect.bottom + 8, left: rect.left },
    });
  }

  // ─── Typing indicator text ─────────────────────────────────────

  const typingNames = Array.from(typingUsers.values()).map((t) => t.userName);
  let typingText = "";
  if (typingNames.length === 1) {
    typingText = `${typingNames[0]} is typing`;
  } else if (typingNames.length === 2) {
    typingText = `${typingNames[0]} and ${typingNames[1]} are typing`;
  } else if (typingNames.length > 2) {
    typingText = "Several people are typing";
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      {/* Channel header */}
      <header className="flex items-center justify-between border-b border-[#EEEEED] bg-white pl-14 pr-6 py-3 md:pl-6">
        <div className="flex items-center">
          <span className="mr-1.5 text-[#A3A3A3]">#</span>
          <h1 className="text-sm font-semibold text-[#2D2D2D]">
            {channelName}
          </h1>
          {isArchived && (
            <span className="ml-2 rounded bg-[#F59E0B]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#F59E0B]">
              Archived
            </span>
          )}
          <span className="ml-2 text-sm text-[#A3A3A3]">
            · {onlineInChannel} online
          </span>
          {channelDescription && (
            <span className="ml-3 hidden text-sm text-[#A3A3A3] sm:inline">
              {channelDescription}
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded p-1.5 text-[#A3A3A3] transition-colors hover:bg-[#F8F8F7] hover:text-[#2D2D2D]"
            title="Channel settings"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        )}
      </header>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto bg-white px-4 py-4 sm:px-6"
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#EEEEED] border-t-[#4F46E5]" />
          </div>
        )}

        {initialLoad && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#EEEEED] border-t-[#4F46E5]" />
          </div>
        )}

        {!initialLoad && messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F8F8F7]">
              <svg
                className="h-7 w-7 text-[#A3A3A3]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-[#2D2D2D]">
              No messages yet
            </p>
            <p className="mt-1 text-sm text-[#A3A3A3]">
              Start the conversation in #{channelName}.
            </p>
          </div>
        )}

        {!initialLoad && messages.length > 0 && !nextCursor && (
          <div className="mb-6 pb-4">
            <p className="text-sm text-[#A3A3A3]">
              This is the beginning of{" "}
              <span className="font-medium text-[#2D2D2D]">
                #{channelName}
              </span>
            </p>
          </div>
        )}

        {!initialLoad &&
          messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const grouped = prev ? shouldGroup(prev, msg) : false;
            const showDateHeader =
              !prev || !isSameDay(prev.createdAt, msg.createdAt);
            const reactions = groupReactions(
              msg.reactions || [],
              currentUserId
            );

            return (
              <div key={msg.id}>
                {showDateHeader && (
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#EEEEED]" />
                    <span className="rounded-full border border-[#EEEEED] bg-white px-3 py-1 text-xs font-medium text-[#A3A3A3] shadow-sm">
                      {getDateLabel(msg.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-[#EEEEED]" />
                  </div>
                )}

                {grouped ? (
                  <div className="group relative flex items-start py-0.5 pl-10 hover:bg-[#F8F8F7]">
                    {!isArchived && (
                      <MessageActions
                        isOwnMessage={msg.userId === currentUserId}
                        onReply={() => setReplyTo(msg)}
                        onForward={() => setForwardMessage(msg)}
                        onReact={(emoji) => handleReact(msg.id, emoji)}
                        onDelete={
                          msg.userId === currentUserId
                            ? () => handleDelete(msg.id)
                            : undefined
                        }
                      />
                    )}
                    <span className="invisible mr-2 flex-shrink-0 text-[11px] text-[#A3A3A3] group-hover:visible">
                      {formatTime(msg.createdAt)}
                    </span>
                    <div className="min-w-0 flex-1">
                      {/* Forwarded label */}
                      {msg.forwardedFromChannel && (
                        <p className="mb-0.5 text-[11px] text-[#A3A3A3]">
                          Forwarded from{" "}
                          <span className="font-medium">
                            #{msg.forwardedFromChannel.name}
                          </span>
                        </p>
                      )}
                      {/* Reply quote */}
                      {msg.replyTo && (
                        <div className="mb-1 flex items-center gap-1.5 border-l-2 border-[#D1D5DB] pl-2 text-xs text-[#A3A3A3]">
                          <span className="font-medium text-[#6B6B6B]">
                            {getUserName(msg.replyTo.user)}
                          </span>
                          <span className="truncate">
                            {msg.replyTo.content.slice(0, 80)}
                          </span>
                        </div>
                      )}
                      <p className="text-[15px] text-[#2D2D2D]">
                        {renderContent(msg.content, members)}
                      </p>
                      {/* Reactions */}
                      {reactions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {reactions.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() => handleReact(msg.id, r.emoji)}
                              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                                r.userReacted
                                  ? "border-[#4F46E5]/30 bg-[#4F46E5]/5 text-[#4F46E5]"
                                  : "border-[#EEEEED] bg-[#F8F8F7] text-[#6B6B6B] hover:border-[#D1D5DB]"
                              }`}
                              title={r.users.join(", ")}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="group relative mt-3 flex items-start gap-2 py-1 hover:bg-[#F8F8F7]">
                    {!isArchived && (
                      <MessageActions
                        isOwnMessage={msg.userId === currentUserId}
                        onReply={() => setReplyTo(msg)}
                        onForward={() => setForwardMessage(msg)}
                        onReact={(emoji) => handleReact(msg.id, emoji)}
                        onDelete={
                          msg.userId === currentUserId
                            ? () => handleDelete(msg.id)
                            : undefined
                        }
                      />
                    )}
                    <button
                      type="button"
                      className="relative mt-0.5 flex-shrink-0"
                      onClick={(e) =>
                        handleAvatarClick(
                          e,
                          msg.user,
                          getMemberStatus(msg.userId)
                        )
                      }
                    >
                      {msg.user.profileImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={msg.user.profileImage}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getUserColor(msg.user) }}
                        >
                          {getUserName(msg.user)[0].toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white ${
                          getMemberStatus(msg.userId) === "online"
                            ? "bg-[#22C55E]"
                            : getMemberStatus(msg.userId) === "idle"
                              ? "bg-[#F59E0B]"
                              : "bg-[#D1D5DB]"
                        }`}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      {/* Forwarded label */}
                      {msg.forwardedFromChannel && (
                        <p className="mb-0.5 text-[11px] text-[#A3A3A3]">
                          Forwarded from{" "}
                          <span className="font-medium">
                            #{msg.forwardedFromChannel.name}
                          </span>
                        </p>
                      )}
                      {/* Reply quote */}
                      {msg.replyTo && (
                        <div className="mb-1 flex items-center gap-1.5 border-l-2 border-[#D1D5DB] pl-2 text-xs text-[#A3A3A3]">
                          <span className="font-medium text-[#6B6B6B]">
                            {getUserName(msg.replyTo.user)}
                          </span>
                          <span className="truncate">
                            {msg.replyTo.content.slice(0, 80)}
                          </span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-[#2D2D2D]">
                          {getUserName(msg.user)}
                        </span>
                        <span className="text-[11px] text-[#A3A3A3]">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-[15px] text-[#2D2D2D]">
                        {renderContent(msg.content, members)}
                      </p>
                      {/* Reactions */}
                      {reactions.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {reactions.map((r) => (
                            <button
                              key={r.emoji}
                              type="button"
                              onClick={() => handleReact(msg.id, r.emoji)}
                              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                                r.userReacted
                                  ? "border-[#4F46E5]/30 bg-[#4F46E5]/5 text-[#4F46E5]"
                                  : "border-[#EEEEED] bg-[#F8F8F7] text-[#6B6B6B] hover:border-[#D1D5DB]"
                              }`}
                              title={r.users.join(", ")}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      {/* New messages pill */}
      {hasNewBelow && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
              setHasNewBelow(false);
            }}
            className="animate-slideUp rounded-full bg-[#4F46E5] px-3 py-1.5 text-xs font-medium text-white shadow-md transition-colors hover:bg-[#4338CA]"
          >
            New messages ↓
          </button>
        </div>
      )}

      {/* Typing indicator */}
      <div className="flex h-6 items-center bg-white px-4 sm:px-6">
        {typingNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
            <span className="flex items-center gap-0.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
            <span>{typingText}</span>
          </div>
        )}
      </div>

      {/* Archived banner OR message input */}
      {isArchived ? (
        <div className="border-t border-[#EEEEED] bg-[#F8F8F7] px-4 py-4 text-center">
          <p className="text-sm text-[#A3A3A3]">
            This channel is archived. No new messages can be sent.
          </p>
        </div>
      ) : (
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
                onClick={() => setReplyTo(null)}
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
      )}

      {/* Forward modal */}
      {forwardMessage && (
        <ForwardModal
          message={forwardMessage}
          channels={channels}
          onClose={() => setForwardMessage(null)}
          socket={socket}
        />
      )}

      {/* Channel settings panel */}
      {showSettings && (
        <ChannelSettings
          channel={{
            id: channelId,
            name: channelName,
            description: channelDescription,
            isDefault: isDefault,
            archived: isArchived,
          }}
          workspaceSlug={workspaceSlug}
          isAdmin={isAdmin}
          isOwner={isOwner}
          onClose={() => setShowSettings(false)}
          onUpdate={() => {
            setShowSettings(false);
            router.refresh();
          }}
        />
      )}

      {/* Profile popup */}
      {profilePopup && (
        <ProfilePopup
          userId={profilePopup.userId}
          avatarColor={profilePopup.avatarColor}
          userName={profilePopup.userName}
          status={profilePopup.status}
          position={profilePopup.position}
          onClose={() => setProfilePopup(null)}
        />
      )}
    </div>
  );
}
