import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";

export type Role = "owner" | "admin" | "member";

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

/**
 * Check if a user has the required role (or higher) in a workspace.
 * Returns the member record if authorized, null otherwise.
 */
export async function hasPermission(
  userId: string,
  workspaceId: string,
  requiredRole: Role
): Promise<typeof workspaceMembers.$inferSelect | null> {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId)
    ),
  });

  if (!member) return null;

  const userLevel = ROLE_HIERARCHY[member.role as Role];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel >= requiredLevel) return member;
  return null;
}

/**
 * Require a minimum role. Returns the member record or throws an error.
 */
export async function requirePermission(
  userId: string,
  workspaceId: string,
  requiredRole: Role
): Promise<typeof workspaceMembers.$inferSelect> {
  const member = await hasPermission(userId, workspaceId, requiredRole);

  if (!member) {
    throw new Error(
      `Unauthorized: requires ${requiredRole} role in this workspace`
    );
  }

  return member;
}

/**
 * Check if a user is a member of a workspace (any role).
 */
export async function isMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const member = await hasPermission(userId, workspaceId, "member");
  return member !== null;
}
