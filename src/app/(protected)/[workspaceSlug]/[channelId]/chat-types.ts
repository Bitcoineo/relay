// Shared types and helpers for the channel chat components

export interface MessageUser {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
  profileImage?: string | null;
}

export interface ReactionData {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; name: string | null };
}

export interface Message {
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

export interface MemberInfo {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#4F46E5", "#0891B2", "#059669", "#D97706",
  "#DC2626", "#7C3AED", "#DB2777", "#2563EB",
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getUserColor(user: MessageUser | MemberInfo): string {
  return (
    user.avatarColor ||
    AVATAR_COLORS[hashCode(user.id) % AVATAR_COLORS.length]
  );
}

export function getUserName(
  user: MessageUser | MemberInfo | { id: string; name: string | null }
): string {
  if ("email" in user) {
    return user.name || user.email.split("@")[0];
  }
  return user.name || "Unknown";
}

export function formatTime(iso: string): string {
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

export function getDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatFullDate(iso);
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function shouldGroup(prev: Message, curr: Message): boolean {
  if (prev.userId !== curr.userId) return false;
  const diff =
    new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return Math.abs(diff) < 5 * 60 * 1000;
}

export function groupReactions(
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
