import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  workspaceInvites,
  workspaceMembers,
  users,
  channels,
  channelMembers,
} from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export async function createInvite(
  workspaceId: string,
  email: string,
  role: "admin" | "member",
  invitedById: string
): Promise<Result<typeof workspaceInvites.$inferSelect>> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
    return { data: null, error: "Invalid email address" };
  }

  // Check if user is already a member
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, normalizedEmail),
  });

  if (existingUser) {
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, existingUser.id)
      ),
    });

    if (existingMember) {
      return {
        data: null,
        error: "This user is already a member of this workspace",
      };
    }
  }

  // Check for existing pending invite
  const existingInvite = await db.query.workspaceInvites.findFirst({
    where: and(
      eq(workspaceInvites.workspaceId, workspaceId),
      eq(workspaceInvites.email, normalizedEmail),
      eq(workspaceInvites.status, "pending")
    ),
  });

  if (existingInvite) {
    return {
      data: null,
      error: "An invite has already been sent to this email",
    };
  }

  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [invite] = await db
    .insert(workspaceInvites)
    .values({
      workspaceId,
      email: normalizedEmail,
      role,
      invitedById,
      expiresAt,
    })
    .returning();

  return { data: invite, error: null };
}

export async function getWorkspaceInvites(
  workspaceId: string
): Promise<
  Result<
    Array<
      typeof workspaceInvites.$inferSelect & {
        invitedBy: { id: string; name: string | null; email: string };
      }
    >
  >
> {
  const invites = await db.query.workspaceInvites.findMany({
    where: and(
      eq(workspaceInvites.workspaceId, workspaceId),
      eq(workspaceInvites.status, "pending")
    ),
    with: {
      invitedBy: {
        columns: { id: true, name: true, email: true },
      },
    },
  });

  return { data: invites, error: null };
}

export async function acceptInvite(
  token: string,
  userId: string,
  userEmail: string
): Promise<Result<{ workspaceSlug: string }>> {
  const invite = await db.query.workspaceInvites.findFirst({
    where: eq(workspaceInvites.token, token),
    with: { workspace: true },
  });

  if (!invite) {
    return { data: null, error: "Invite not found" };
  }

  if (invite.status !== "pending") {
    return {
      data: null,
      error: `This invite has already been ${invite.status}`,
    };
  }

  if (new Date(invite.expiresAt) < new Date()) {
    await db
      .update(workspaceInvites)
      .set({ status: "expired" })
      .where(eq(workspaceInvites.id, invite.id));
    return { data: null, error: "This invite has expired" };
  }

  if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      data: null,
      error: "This invite was sent to a different email address",
    };
  }

  // Race condition guard
  const existingMember = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, invite.workspaceId),
      eq(workspaceMembers.userId, userId)
    ),
  });

  if (existingMember) {
    await db
      .update(workspaceInvites)
      .set({ status: "accepted" })
      .where(eq(workspaceInvites.id, invite.id));
    return { data: { workspaceSlug: invite.workspace.slug }, error: null };
  }

  // Add to workspace
  await db.insert(workspaceMembers).values({
    workspaceId: invite.workspaceId,
    userId,
    role: invite.role,
  });

  // Auto-join all workspace channels
  const workspaceChannels = await db.query.channels.findMany({
    where: eq(channels.workspaceId, invite.workspaceId),
  });

  for (const channel of workspaceChannels) {
    await db
      .insert(channelMembers)
      .values({ channelId: channel.id, userId })
      .onConflictDoNothing();
  }

  // Auto-verify email — accepting an invite proves email ownership
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, userId));

  await db
    .update(workspaceInvites)
    .set({ status: "accepted" })
    .where(eq(workspaceInvites.id, invite.id));

  return { data: { workspaceSlug: invite.workspace.slug }, error: null };
}

export async function declineInvite(
  token: string,
  userId: string,
  userEmail: string
): Promise<Result<{ declined: boolean }>> {
  const invite = await db.query.workspaceInvites.findFirst({
    where: eq(workspaceInvites.token, token),
  });

  if (!invite) {
    return { data: null, error: "Invite not found" };
  }

  if (invite.status !== "pending") {
    return {
      data: null,
      error: `This invite has already been ${invite.status}`,
    };
  }

  if (userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return {
      data: null,
      error: "This invite was sent to a different email address",
    };
  }

  await db
    .update(workspaceInvites)
    .set({ status: "declined" })
    .where(eq(workspaceInvites.id, invite.id));

  return { data: { declined: true }, error: null };
}

export async function cancelInvite(
  inviteId: string,
  workspaceId: string
): Promise<Result<{ cancelled: boolean }>> {
  const invite = await db.query.workspaceInvites.findFirst({
    where: and(
      eq(workspaceInvites.id, inviteId),
      eq(workspaceInvites.workspaceId, workspaceId)
    ),
  });

  if (!invite) {
    return { data: null, error: "Invite not found" };
  }

  if (invite.status !== "pending") {
    return { data: null, error: "Only pending invites can be cancelled" };
  }

  await db
    .delete(workspaceInvites)
    .where(eq(workspaceInvites.id, inviteId));

  return { data: { cancelled: true }, error: null };
}

export async function getInviteByToken(token: string): Promise<
  Result<{
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    workspace: { id: string; name: string; slug: string };
    invitedBy: { name: string | null };
  } | null>
> {
  const invite = await db.query.workspaceInvites.findFirst({
    where: eq(workspaceInvites.token, token),
    with: {
      workspace: {
        columns: { id: true, name: true, slug: true },
      },
      invitedBy: {
        columns: { name: true },
      },
    },
  });

  if (!invite) {
    return { data: null, error: "Invite not found" };
  }

  // Auto-expire
  if (
    invite.status === "pending" &&
    new Date(invite.expiresAt) < new Date()
  ) {
    await db
      .update(workspaceInvites)
      .set({ status: "expired" })
      .where(eq(workspaceInvites.id, invite.id));
    return { data: null, error: "This invite has expired" };
  }

  return {
    data: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      workspace: invite.workspace,
      invitedBy: invite.invitedBy,
    },
    error: null,
  };
}
