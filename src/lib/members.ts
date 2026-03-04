import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { workspaceMembers } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export async function getWorkspaceMembers(workspaceId: string): Promise<
  Result<
    Array<{
      id: string;
      role: string;
      joinedAt: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        profileImage: string | null;
        avatarColor: string | null;
        status: string;
      };
    }>
  >
> {
  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    orderBy: [asc(workspaceMembers.joinedAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          avatarColor: true,
          status: true,
        },
      },
    },
  });

  return { data: members, error: null };
}

export async function updateMemberRole(
  memberId: string,
  workspaceId: string,
  newRole: "admin" | "member"
): Promise<Result<typeof workspaceMembers.$inferSelect>> {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.id, memberId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!member) {
    return { data: null, error: "Member not found" };
  }

  if (member.role === "owner") {
    return { data: null, error: "Cannot change the owner's role" };
  }

  const [updated] = await db
    .update(workspaceMembers)
    .set({ role: newRole })
    .where(eq(workspaceMembers.id, memberId))
    .returning();

  return { data: updated, error: null };
}

export async function removeMember(
  memberId: string,
  workspaceId: string
): Promise<Result<{ removed: boolean }>> {
  const member = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.id, memberId),
      eq(workspaceMembers.workspaceId, workspaceId)
    ),
  });

  if (!member) {
    return { data: null, error: "Member not found" };
  }

  if (member.role === "owner") {
    return { data: null, error: "Cannot remove the workspace owner" };
  }

  await db
    .delete(workspaceMembers)
    .where(eq(workspaceMembers.id, memberId));

  return { data: { removed: true }, error: null };
}
