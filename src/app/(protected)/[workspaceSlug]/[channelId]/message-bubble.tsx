"use client";

import MessageActions from "./message-actions";
import {
  type Message,
  type MemberInfo,
  type MessageUser,
  getUserColor,
  getUserName,
  formatTime,
  getDateLabel,
  isSameDay,
  shouldGroup,
  groupReactions,
} from "./chat-types";

interface MessageBubbleProps {
  message: Message;
  prevMessage: Message | null;
  currentUserId: string;
  members: MemberInfo[];
  isArchived: boolean;
  onReply: () => void;
  onForward: () => void;
  onReact: (emoji: string) => void;
  onDelete?: () => void;
  onAvatarClick: (e: React.MouseEvent, user: MessageUser, status: string) => void;
  getMemberStatus: (userId: string) => string;
}

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

export default function MessageBubble({
  message: msg,
  prevMessage: prev,
  currentUserId,
  members,
  isArchived,
  onReply,
  onForward,
  onReact,
  onDelete,
  onAvatarClick,
  getMemberStatus,
}: MessageBubbleProps) {
  const grouped = prev ? shouldGroup(prev, msg) : false;
  const showDateHeader = !prev || !isSameDay(prev.createdAt, msg.createdAt);
  const reactions = groupReactions(msg.reactions || [], currentUserId);

  const actionsBar = !isArchived && (
    <MessageActions
      isOwnMessage={msg.userId === currentUserId}
      onReply={onReply}
      onForward={onForward}
      onReact={onReact}
      onDelete={onDelete}
    />
  );

  const forwardedLabel = msg.forwardedFromChannel && (
    <p className="mb-0.5 text-[11px] text-[var(--text-muted)]">
      Forwarded from{" "}
      <span className="font-medium">#{msg.forwardedFromChannel.name}</span>
    </p>
  );

  const replyQuote = msg.replyTo && (
    <div className="mb-1 flex items-center gap-1.5 border-l-2 border-[var(--border-strong)] pl-2 text-xs text-[var(--text-muted)]">
      <span className="font-medium text-[var(--text-secondary)]">
        {getUserName(msg.replyTo.user)}
      </span>
      <span className="truncate">{msg.replyTo.content.slice(0, 80)}</span>
    </div>
  );

  const reactionPills = reactions.length > 0 && (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onReact(r.emoji)}
          className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
            r.userReacted
              ? "border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[var(--accent-text)]"
              : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
          }`}
          title={r.users.join(", ")}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div>
      {showDateHeader && (
        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] shadow-sm">
            {getDateLabel(msg.createdAt)}
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>
      )}

      {grouped ? (
        <div className="group relative flex items-start py-0.5 pl-10 hover:bg-[var(--bg-secondary)]">
          {actionsBar}
          <span className="invisible mr-2 flex-shrink-0 text-[11px] text-[var(--text-muted)] group-hover:visible">
            {formatTime(msg.createdAt)}
          </span>
          <div className="min-w-0 flex-1">
            {forwardedLabel}
            {replyQuote}
            <p className="text-[15px] text-[var(--text-primary)]">
              {renderContent(msg.content, members)}
            </p>
            {reactionPills}
          </div>
        </div>
      ) : (
        <div className="group relative mt-3 flex items-start gap-2 py-1 hover:bg-[var(--bg-secondary)]">
          {actionsBar}
          <button
            type="button"
            className="relative mt-0.5 flex-shrink-0"
            onClick={(e) =>
              onAvatarClick(e, msg.user, getMemberStatus(msg.userId))
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
              className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-[var(--status-dot-border)] ${
                getMemberStatus(msg.userId) === "online"
                  ? "bg-[var(--success)]"
                  : getMemberStatus(msg.userId) === "idle"
                    ? "bg-[var(--warning)]"
                    : "bg-[var(--border-strong)]"
              }`}
            />
          </button>
          <div className="min-w-0 flex-1">
            {forwardedLabel}
            {replyQuote}
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {getUserName(msg.user)}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {formatTime(msg.createdAt)}
              </span>
            </div>
            <p className="text-[15px] text-[var(--text-primary)]">
              {renderContent(msg.content, members)}
            </p>
            {reactionPills}
          </div>
        </div>
      )}
    </div>
  );
}
