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
    <p className="mb-0.5 text-[11px] text-[#A3A3A3]">
      Forwarded from{" "}
      <span className="font-medium">#{msg.forwardedFromChannel.name}</span>
    </p>
  );

  const replyQuote = msg.replyTo && (
    <div className="mb-1 flex items-center gap-1.5 border-l-2 border-[#D1D5DB] pl-2 text-xs text-[#A3A3A3]">
      <span className="font-medium text-[#6B6B6B]">
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
  );

  return (
    <div>
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
          {actionsBar}
          <span className="invisible mr-2 flex-shrink-0 text-[11px] text-[#A3A3A3] group-hover:visible">
            {formatTime(msg.createdAt)}
          </span>
          <div className="min-w-0 flex-1">
            {forwardedLabel}
            {replyQuote}
            <p className="text-[15px] text-[#2D2D2D]">
              {renderContent(msg.content, members)}
            </p>
            {reactionPills}
          </div>
        </div>
      ) : (
        <div className="group relative mt-3 flex items-start gap-2 py-1 hover:bg-[#F8F8F7]">
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
            {forwardedLabel}
            {replyQuote}
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
            {reactionPills}
          </div>
        </div>
      )}
    </div>
  );
}
