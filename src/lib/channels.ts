import { eq, and, ne } from "drizzle-orm";
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
  userId: string,
  includeArchived: boolean = false
): Promise<Result<Array<typeof channels.$inferSelect>>> {
  const memberships = await db.query.channelMembers.findMany({
    where: eq(channelMembers.userId, userId),
    with: { channel: true },
  });

  const result = memberships
    .map((m) => m.channel)
    .filter((c) => c.workspaceId === workspaceId)
    .filter((c) => c.isDm === 0)
    .filter((c) => includeArchived || c.archived === 0);

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

export async function getChannelMembers(channelId: string) {
  const members = await db.query.channelMembers.findMany({
    where: eq(channelMembers.channelId, channelId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          avatarColor: true,
          profileImage: true,
          status: true,
        },
      },
    },
  });
  return members;
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
  if (channel.isDm === 1) {
    return { data: null, error: "Cannot leave a direct message" };
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
  if (channel.isDm === 1) {
    return { data: null, error: "Cannot delete a direct message" };
  }

  await db.delete(channels).where(eq(channels.id, channelId));

  return { data: { deleted: true }, error: null };
}

export async function updateChannel(
  channelId: string,
  data: { name?: string; description?: string | null }
): Promise<Result<typeof channels.$inferSelect>> {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });
  if (!channel) {
    return { data: null, error: "Channel not found" };
  }

  if (channel.isDm === 1) {
    return { data: null, error: "Cannot update a direct message channel" };
  }

  const updates: Partial<typeof channels.$inferInsert> = {};

  if (data.name !== undefined) {
    const trimmed = data.name.trim().toLowerCase().replace(/\s+/g, "-");
    if (!trimmed || trimmed.length < 2) {
      return { data: null, error: "Channel name must be at least 2 characters" };
    }
    // Check for duplicate name in workspace
    const existing = await db.query.channels.findFirst({
      where: and(
        eq(channels.workspaceId, channel.workspaceId),
        eq(channels.name, trimmed),
        ne(channels.id, channelId)
      ),
    });
    if (existing) {
      return { data: null, error: "A channel with this name already exists" };
    }
    updates.name = trimmed;
  }

  if (data.description !== undefined) {
    updates.description = data.description || null;
  }

  const [updated] = await db
    .update(channels)
    .set(updates)
    .where(eq(channels.id, channelId))
    .returning();

  return { data: updated, error: null };
}

export async function setChannelDefault(
  channelId: string,
  workspaceId: string
): Promise<Result<{ updated: boolean }>> {
  // Unset old default
  await db
    .update(channels)
    .set({ isDefault: 0 })
    .where(
      and(eq(channels.workspaceId, workspaceId), eq(channels.isDefault, 1))
    );

  // Set new default
  await db
    .update(channels)
    .set({ isDefault: 1 })
    .where(eq(channels.id, channelId));

  return { data: { updated: true }, error: null };
}

export async function archiveChannel(
  channelId: string
): Promise<Result<{ archived: boolean }>> {
  const channel = await db.query.channels.findFirst({
    where: eq(channels.id, channelId),
  });
  if (!channel) {
    return { data: null, error: "Channel not found" };
  }
  if (channel.isDefault === 1) {
    return { data: null, error: "Cannot archive the default channel" };
  }
  if (channel.isDm === 1) {
    return { data: null, error: "Cannot archive a direct message" };
  }

  await db
    .update(channels)
    .set({ archived: 1 })
    .where(eq(channels.id, channelId));

  return { data: { archived: true }, error: null };
}

export async function unarchiveChannel(
  channelId: string
): Promise<Result<{ archived: boolean }>> {
  await db
    .update(channels)
    .set({ archived: 0 })
    .where(eq(channels.id, channelId));

  return { data: { archived: false }, error: null };
}
