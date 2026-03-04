import { eq, and, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import { messages, users } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export type ReactionData = {
  id: string;
  emoji: string;
  userId: string;
  user: { id: string; name: string | null };
};

export type MessageWithUser = typeof messages.$inferSelect & {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatarColor: string | null;
    profileImage: string | null;
  };
  replyTo: {
    id: string;
    content: string;
    user: { id: string; name: string | null };
  } | null;
  forwardedFromChannel: { id: string; name: string } | null;
  forwardedFromUser: { id: string; name: string | null } | null;
  reactions: ReactionData[];
};

export async function createMessage(
  channelId: string,
  userId: string,
  content: string,
  replyToId?: string
): Promise<Result<MessageWithUser>> {
  const trimmed = content.trim();
  if (!trimmed) {
    return { data: null, error: "Message cannot be empty" };
  }

  // Validate replyToId is in the same channel
  if (replyToId) {
    const replyMsg = await db.query.messages.findFirst({
      where: eq(messages.id, replyToId),
    });
    if (!replyMsg || replyMsg.channelId !== channelId) {
      return { data: null, error: "Reply target not found in this channel" };
    }
  }

  const [message] = await db
    .insert(messages)
    .values({
      channelId,
      userId,
      content: trimmed,
      replyToId: replyToId || null,
    })
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      avatarColor: true,
      profileImage: true,
    },
  });

  // Fetch replyTo data if present
  let replyTo: MessageWithUser["replyTo"] = null;
  if (replyToId) {
    const replyMsg = await db.query.messages.findFirst({
      where: eq(messages.id, replyToId),
      with: { user: { columns: { id: true, name: true } } },
    });
    if (replyMsg) {
      replyTo = {
        id: replyMsg.id,
        content: replyMsg.content,
        user: replyMsg.user,
      };
    }
  }

  return {
    data: {
      ...message,
      user: user ?? {
        id: userId,
        name: null,
        email: "",
        avatarColor: null,
        profileImage: null,
      },
      replyTo,
      forwardedFromChannel: null,
      forwardedFromUser: null,
      reactions: [],
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
        columns: {
          id: true,
          name: true,
          email: true,
          avatarColor: true,
          profileImage: true,
        },
      },
      replyTo: {
        columns: { id: true, content: true },
        with: { user: { columns: { id: true, name: true } } },
      },
      forwardedFromChannel: {
        columns: { id: true, name: true },
      },
      forwardedFromUser: {
        columns: { id: true, name: true },
      },
      reactions: {
        columns: { id: true, emoji: true, userId: true },
        with: { user: { columns: { id: true, name: true } } },
      },
    },
  });

  const hasMore = rows.length > limit;
  const slice = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? slice[slice.length - 1].createdAt : null;

  return { data: { messages: slice, nextCursor }, error: null };
}

export async function forwardMessage(
  fromMessageId: string,
  toChannelId: string,
  forwardedByUserId: string
): Promise<Result<MessageWithUser>> {
  const original = await db.query.messages.findFirst({
    where: eq(messages.id, fromMessageId),
    with: {
      channel: { columns: { id: true, name: true } },
      user: { columns: { id: true, name: true } },
    },
  });

  if (!original) {
    return { data: null, error: "Original message not found" };
  }

  const [forwarded] = await db
    .insert(messages)
    .values({
      channelId: toChannelId,
      userId: forwardedByUserId,
      content: original.content,
      forwardedFromChannelId: original.channel.id,
      forwardedFromUserId: original.user.id,
    })
    .returning();

  const user = await db.query.users.findFirst({
    where: eq(users.id, forwardedByUserId),
    columns: {
      id: true,
      name: true,
      email: true,
      avatarColor: true,
      profileImage: true,
    },
  });

  return {
    data: {
      ...forwarded,
      user: user ?? {
        id: forwardedByUserId,
        name: null,
        email: "",
        avatarColor: null,
        profileImage: null,
      },
      replyTo: null,
      forwardedFromChannel: original.channel,
      forwardedFromUser: original.user,
      reactions: [],
    },
    error: null,
  };
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
