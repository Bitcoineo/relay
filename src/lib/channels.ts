import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { channels, channelMembers } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export async function createChannel(
  workspaceId: string,
  name: string,
  description: string | null,
  createdBy: string
): Promise<Result<typeof channels.$inferSelect>> {
  const trimmed = name.trim().toLowerCase().replace(/\s+/g, "-");
  if (!trimmed || trimmed.length < 2) {
    return { data: null, error: "Channel name must be at least 2 characters" };
  }

  // Check for duplicate name in workspace
  const existing = await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspaceId),
      eq(channels.name, trimmed)
    ),
  });
  if (existing) {
    return { data: null, error: "A channel with this name already exists" };
  }

  const [channel] = await db
    .insert(channels)
    .values({
      workspaceId,
      name: trimmed,
      description: description || null,
      createdBy,
    })
    .returning();

  // Add creator as channel member
  await db.insert(channelMembers).values({
    channelId: channel.id,
    userId: createdBy,
  });

  return { data: channel, error: null };
}

export async function getWorkspaceChannels(
  workspaceId: string,
  userId: string
): Promise<Result<Array<typeof channels.$inferSelect>>> {
  const memberships = await db.query.channelMembers.findMany({
    where: eq(channelMembers.userId, userId),
    with: { channel: true },
  });

  const result = memberships
    .map((m) => m.channel)
    .filter((c) => c.workspaceId === workspaceId);

  return { data: result, error: null };
}

export async function getChannelById(
  channelId: string
): Promise<Result<typeof channels.$inferSelect | null>> {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });

  return { data: channel ?? null, error: null };
}

export async function joinChannel(
  channelId: string,
  userId: string
): Promise<Result<{ joined: boolean }>> {
  // Check if already a member
  const existing = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, channelId),
      eq(channelMembers.userId, userId)
    ),
  });
  if (existing) {
    return { data: { joined: true }, error: null };
  }

  await db.insert(channelMembers).values({ channelId, userId });

  return { data: { joined: true }, error: null };
}

export async function leaveChannel(
  channelId: string,
  userId: string
): Promise<Result<{ left: boolean }>> {
  // Cannot leave default channel
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });
  if (!channel) {
    return { data: null, error: "Channel not found" };
  }
  if (channel.isDefault === 1) {
    return { data: null, error: "Cannot leave the default channel" };
  }

  await db
    .delete(channelMembers)
    .where(
      and(
        eq(channelMembers.channelId, channelId),
        eq(channelMembers.userId, userId)
      )
    );

  return { data: { left: true }, error: null };
}

export async function deleteChannel(
  channelId: string
): Promise<Result<{ deleted: boolean }>> {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });
  if (!channel) {
    return { data: null, error: "Channel not found" };
  }
  if (channel.isDefault === 1) {
    return { data: null, error: "Cannot delete the default channel" };
  }

  await db.delete(channels).where(eq(channels.id, channelId));

  return { data: { deleted: true }, error: null };
}
