import { eq, and, inArray } from "drizzle-orm";
import { db } from "@/db";
import { channels, channelMembers } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Get or create a DM channel between two users in a workspace.
 * Uses a deterministic name to prevent duplicate DMs.
 */
export async function getOrCreateDM(
  workspaceId: string,
  userId1: string,
  userId2: string
): Promise<Result<{ channelId: string }>> {
  if (userId1 === userId2) {
    return { data: null, error: "Cannot DM yourself" };
  }

  const dmName = `dm-${[userId1, userId2].sort().join("-")}`;

  // Check for existing DM
  const existing = await db.query.channels.findFirst({
    where: and(
      eq(channels.workspaceId, workspaceId),
      eq(channels.name, dmName),
      eq(channels.isDm, 1)
    ),
  });

  if (existing) {
    return { data: { channelId: existing.id }, error: null };
  }

  // Create new DM channel
  const [channel] = await db
    .insert(channels)
    .values({
      workspaceId,
      name: dmName,
      isDm: 1,
      createdBy: userId1,
    })
    .returning();

  // Add both users as members
  await db.insert(channelMembers).values([
    { channelId: channel.id, userId: userId1 },
    { channelId: channel.id, userId: userId2 },
  ]);

  return { data: { channelId: channel.id }, error: null };
}

/**
 * Get all DM channels for a user in a workspace, with the other user's info.
 * Uses a single batch query instead of N+1.
 */
export async function getUserDMs(
  workspaceId: string,
  userId: string
): Promise<
  Result<
    Array<{
      channelId: string;
      otherUser: {
        id: string;
        name: string | null;
        email: string;
        avatarColor: string | null;
        profileImage: string | null;
        status: string;
      };
    }>
  >
> {
  // Get all channel memberships for this user
  const memberships = await db.query.channelMembers.findMany({
    where: eq(channelMembers.userId, userId),
    with: { channel: true },
  });

  // Filter to DM channels in this workspace
  const dmChannelIds = memberships
    .filter((m) => m.channel.workspaceId === workspaceId && m.channel.isDm === 1)
    .map((m) => m.channelId);

  if (dmChannelIds.length === 0) {
    return { data: [], error: null };
  }

  // Batch: fetch ALL members of ALL DM channels in one query
  const allDmMembers = await db.query.channelMembers.findMany({
    where: inArray(channelMembers.channelId, dmChannelIds),
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

  // Group by channelId and find the other user
  const result = dmChannelIds
    .map((channelId) => {
      const other = allDmMembers.find(
        (m) => m.channelId === channelId && m.userId !== userId
      );
      if (!other) return null;
      return { channelId, otherUser: other.user };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return { data: result, error: null };
}
