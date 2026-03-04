import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getWorkspaceChannels } from "@/lib/channels";
import { hasPermission, isMember } from "@/lib/permissions";
import { getWorkspaceMembers } from "@/lib/members";
import Sidebar from "./sidebar";
import SocketProvider from "./socket-provider";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { workspaceSlug: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const memberCheck = await isMember(session.user.id, workspace.id);
  if (!memberCheck) redirect("/workspaces");

  const { data: channels } = await getWorkspaceChannels(
    workspace.id,
    session.user.id
  );

  const isAdmin = !!(await hasPermission(
    session.user.id,
    workspace.id,
    "admin"
  ));

  const { data: members } = await getWorkspaceMembers(workspace.id);
  const onlineCount = (members ?? []).filter(
    (m) => m.user.status === "online"
  ).length;
  const onlineMembers = (members ?? [])
    .filter((m) => m.user.status === "online")
    .slice(0, 5)
    .map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarColor: m.user.avatarColor,
    }));

  return (
    <SocketProvider>
      <div className="relative flex h-screen">
        <Sidebar
          workspaceName={workspace.name}
          workspaceSlug={params.workspaceSlug}
          channels={(channels ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            isDefault: c.isDefault === 1,
          }))}
          isAdmin={isAdmin}
          userName={session.user.name || session.user.email || "User"}
          avatarColor="#4F46E5"
          onlineCount={onlineCount}
          onlineMembers={onlineMembers}
        />

        <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
      </div>
    </SocketProvider>
  );
}
