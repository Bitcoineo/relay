"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSocket } from "../socket-provider";
import { useRouter } from "next/navigation";
import ForwardModal from "./forward-modal";
import ChannelSettings from "./channel-settings";
import ProfilePopup from "./profile-popup";
import MessageBubble from "./message-bubble";
import MessageInput from "./message-input";
import TypingIndicator from "./typing-indicator";
import PinnedMessagesPanel from "./pinned-messages-panel";
import type { Message, MemberInfo, MessageUser } from "./chat-types";
import { getUserColor, getUserName } from "./chat-types";

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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const [typingUsers, setTypingUsers] = useState<
    Map<string, { userName: string; timeout: NodeJS.Timeout }>
  >(new Map());

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [profilePopup, setProfilePopup] = useState<{
    userId: string;
    avatarColor: string;
    userName: string;
    status: string;
    position: { top: number; left: number };
  } | null>(null);

  const [presenceMap, setPresenceMap] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    members.forEach((m) => map.set(m.id, m.status));
    return map;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function getMemberStatus(userId: string): string {
    return presenceMap.get(userId) || "offline";
  }

  const onlineInChannel = members.filter(
    (m) => getMemberStatus(m.id) === "online"
  ).length;

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

  const fetchPinnedMessages = useCallback(async () => {
    const res = await fetch(
      `/api/workspaces/${workspaceSlug}/channels/${channelId}/pins`
    );
    if (!res.ok) return;
    const data = await res.json();
    setPinnedMessages(data);
    setPinnedCount(data.length);
  }, [workspaceSlug, channelId]);

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

    fetchPinnedMessages();

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

      const handleMessagePinned = (data: {
        message: Message;
        action: "pinned" | "unpinned";
        pinnedByName: string;
      }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.message.id
              ? {
                  ...msg,
                  pinnedAt: data.message.pinnedAt,
                  pinnedById: data.message.pinnedById,
                  pinnedBy: data.message.pinnedBy,
                }
              : msg
          )
        );
        setPinnedCount((prev) =>
          data.action === "pinned" ? prev + 1 : Math.max(0, prev - 1)
        );
        setPinnedMessages((prev) =>
          data.action === "pinned"
            ? [data.message, ...prev]
            : prev.filter((m) => m.id !== data.message.id)
        );
      };

      socket.on("new_message", handleNewMessage);
      socket.on("user_typing", handleTyping);
      socket.on("user_stop_typing", handleStopTyping);
      socket.on("presence_update", handlePresence);
      socket.on("reaction_update", handleReactionUpdate);
      socket.on("message_pinned", handleMessagePinned);

      return () => {
        mounted = false;
        socket.emit("leave_channel", channelId);
        socket.off("new_message", handleNewMessage);
        socket.off("user_typing", handleTyping);
        socket.off("user_stop_typing", handleStopTyping);
        socket.off("presence_update", handlePresence);
        socket.off("reaction_update", handleReactionUpdate);
        socket.off("message_pinned", handleMessagePinned);
      };
    }

    return () => {
      mounted = false;
    };
  }, [socket, channelId, fetchMessages, fetchPinnedMessages, currentUserId]);

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
          container.scrollTop = container.scrollHeight - prevScrollHeight;
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

  // ─── Event handlers ─────────────────────────────────────────────

  function handleReact(messageId: string, emoji: string) {
    if (!socket) return;
    socket.emit("send_reaction", { channelId, messageId, emoji });
  }

  function handlePin(messageId: string) {
    if (!socket) return;
    socket.emit("pin_message", { channelId, messageId });
  }

  function handleDelete(messageId: string) {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    if (socket) {
      socket.emit("delete_message", { channelId, messageId });
    }
  }

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

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col">
      {/* Channel header */}
      <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-primary)] pl-14 pr-6 py-3 md:pl-6">
        <div className="flex items-center">
          <span className="mr-1.5 text-[var(--text-muted)]">#</span>
          <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            {channelName}
          </h1>
          {isArchived && (
            <span className="ml-2 rounded bg-[var(--warning)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--warning)]">
              Archived
            </span>
          )}
          <span className="ml-2 text-sm text-[var(--text-muted)]">
            · {onlineInChannel} online
          </span>
          {channelDescription && (
            <span className="ml-3 hidden text-sm text-[var(--text-muted)] sm:inline">
              {channelDescription}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setShowSettings(false);
              if (!showPinned) fetchPinnedMessages();
              setShowPinned(!showPinned);
            }}
            className="flex items-center gap-1 rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            title="Pinned messages"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4v3.2c0 .28-.11.55-.3.75L5.4 11.6c-.5.53-.2 1.4.5 1.4h5.1v6l1 2 1-2v-6h5.1c.7 0 1-.87.5-1.4L15.3 7.95a1.06 1.06 0 01-.3-.75V4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4h10" />
            </svg>
            {pinnedCount > 0 && (
              <span className="text-xs font-medium">{pinnedCount}</span>
            )}
          </button>
          {isAdmin && (
          <button
            type="button"
            onClick={() => { setShowPinned(false); setShowSettings(true); }}
            className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
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
        </div>
      </header>

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto bg-[var(--bg-primary)] px-4 py-4 sm:px-6"
      >
        {loadingOlder && (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          </div>
        )}

        {initialLoad && (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          </div>
        )}

        {!initialLoad && messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-secondary)]">
              <svg
                className="h-7 w-7 text-[var(--text-muted)]"
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
            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">
              No messages yet
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Start the conversation in #{channelName}.
            </p>
          </div>
        )}

        {!initialLoad && messages.length > 0 && !nextCursor && (
          <div className="mb-6 pb-4">
            <p className="text-sm text-[var(--text-muted)]">
              This is the beginning of{" "}
              <span className="font-medium text-[var(--text-primary)]">
                #{channelName}
              </span>
            </p>
          </div>
        )}

        {!initialLoad &&
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              prevMessage={i > 0 ? messages[i - 1] : null}
              currentUserId={currentUserId}
              members={members}
              isArchived={isArchived}
              onReply={() => setReplyTo(msg)}
              onForward={() => setForwardMessage(msg)}
              onReact={(emoji) => handleReact(msg.id, emoji)}
              onDelete={
                msg.userId === currentUserId
                  ? () => handleDelete(msg.id)
                  : undefined
              }
              canPin={isAdmin || isOwner}
              onPin={isAdmin || isOwner ? () => handlePin(msg.id) : undefined}
              onAvatarClick={handleAvatarClick}
              getMemberStatus={getMemberStatus}
            />
          ))}

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
            className="animate-slideUp rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--text-inverse)] shadow-md transition-colors hover:bg-[var(--accent-hover)]"
          >
            New messages ↓
          </button>
        </div>
      )}

      <TypingIndicator typingUsers={typingUsers} />

      {/* Archived banner OR message input */}
      {isArchived ? (
        <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            This channel is archived. No new messages can be sent.
          </p>
        </div>
      ) : (
        <MessageInput
          channelName={channelName}
          channelId={channelId}
          socket={socket}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onMessageSent={() => setReplyTo(null)}
          members={members}
          currentUserId={currentUserId}
        />
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

      {/* Pinned messages panel */}
      {showPinned && (
        <PinnedMessagesPanel
          pinnedMessages={pinnedMessages}
          canPin={!!(isAdmin || isOwner)}
          onUnpin={(messageId) => handlePin(messageId)}
          onClose={() => setShowPinned(false)}
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
