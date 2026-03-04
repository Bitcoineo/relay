import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  workspaces,
  workspaceMembers,
  channels,
  channelMembers,
} from "@/db/schema";
import { nanoid } from "nanoid";

type Result<T> = { data: T; error: null } | { data: null; error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createWorkspace(
  userId: string,
  name: string
): Promise<Result<typeof workspaces.$inferSelect>> {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) {
    return { data: null, error: "Workspace name must be at least 2 characters" };
  }

  let slug = slugify(trimmed);
  if (!slug) slug = "workspace";

  // Avoid slug collisions
  const existing = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });
  if (existing) {
    slug = `${slug}-${nanoid(6)}`;
  }

  const [workspace] = await db
    .insert(workspaces)
    .values({ name: trimmed, slug, ownerId: userId })
    .returning();

  // Add creator as owner
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
  });

  // Create default #general channel
  const [generalChannel] = await db
    .insert(channels)
    .values({
      workspaceId: workspace.id,
      name: "general",
      isDefault: 1,
      createdBy: userId,
    })
    .returning();

  // Add creator to #general
  await db.insert(channelMembers).values({
    channelId: generalChannel.id,
    userId,
  });

  return { data: workspace, error: null };
}

export async function getUserWorkspaces(
  userId: string
): Promise<Result<Array<typeof workspaces.$inferSelect & { role: string }>>> {
  const memberships = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: { workspace: true },
  });

  const result = memberships.map((m) => ({
    ...m.workspace,
    role: m.role,
  }));

  return { data: result, error: null };
}

export async function getWorkspaceBySlug(
  slug: string
): Promise<Result<typeof workspaces.$inferSelect | null>> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.slug, slug),
  });

  return { data: workspace ?? null, error: null };
}

export async function deleteWorkspace(
  workspaceId: string,
  userId: string
): Promise<Result<{ deleted: boolean }>> {
  const workspace = await db.query.workspaces.findFirst({
    where: eq(workspaces.id, workspaceId),
  });

  if (!workspace) {
    return { data: null, error: "Workspace not found" };
  }

  if (workspace.ownerId !== userId) {
    return { data: null, error: "Only the workspace owner can delete it" };
  }

  await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

  return { data: { deleted: true }, error: null };
}
