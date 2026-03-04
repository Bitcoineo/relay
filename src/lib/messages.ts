import { eq, and, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export type MessageWithUser = typeof messages.$inferSelect & {
  user: { id: string; name: string | null; email: string; avatarColor: string | null };
};

export async function createMessage(
  channelId: string,
  userId: string,
  content: string
): Promise<Result<MessageWithUser>> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { data: null, error: "Message cannot be empty" };
  }

  const [message] = await db
    .insert(messages)
    .values({ channelId, userId, content: trimmed })
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, name: true, email: true, avatarColor: true },
  });

  return {
    data: {
      ...message,
      user: user ?? { id: userId, name: null, email: "", avatarColor: null },
    },
    error: null,
  };
}

export async function getChannelMessages(
  channelId: string,
  cursor?: string,
  limit: number = 50
): Promise<Result<{ messages: MessageWithUser[]; nextCursor: string | null }>> {
  const conditions = [eq(messages.channelId, channelId)];

  if (cursor) {
    conditions.push(lt(messages.createdAt, cursor));
  }

  const rows = await db.query.messages.findMany({
    where: and(...conditions),
    orderBy: [desc(messages.createdAt)],
    limit: limit + 1,
    with: {
      user: {
        columns: { id: true, name: true, email: true, avatarColor: true },
      },
    },
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1].createdAt : null;

  return { data: { messages: slice, nextCursor }, error: null };
}

export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<Result<{ deleted: boolean }>> {
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });

  if (!message) {
    return { data: null, error: "Message not found" };
  }

  if (message.userId !== userId) {
    return { data: null, error: "You can only delete your own messages" };
  }

  await db.delete(messages).where(eq(messages.id, messageId));

  return { data: { deleted: true }, error: null };
}
