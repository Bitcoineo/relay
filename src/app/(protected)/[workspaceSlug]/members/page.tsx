import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { hasPermission, isMember } from "@/lib/permissions";
import { getWorkspaceMembers } from "@/lib/members";
import { getWorkspaceInvites } from "@/lib/invites";
import MemberList from "./member-list";

export default async function MembersPage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const memberCheck = await isMember(session.user.id, workspace.id);
  if (!memberCheck) redirect("/workspaces");

  const { data: members } = await getWorkspaceMembers(workspace.id);
  const { data: invites } = await getWorkspaceInvites(workspace.id);

  const currentMember = await hasPermission(
    session.user.id,
    workspace.id,
    "member"
  );

  return (
    <div className="flex-1 overflow-auto p-6 lg:p-8">
      <h1 className="text-lg font-semibold text-[var(--text-primary)]">Members</h1>
      <div className="mt-6">
        <MemberList
          members={members ?? []}
          pendingInvites={invites ?? []}
          currentUserRole={currentMember?.role || "member"}
          currentUserId={session.user.id}
          workspaceSlug={params.workspaceSlug}
        />
      </div>
    </div>
  );
}
