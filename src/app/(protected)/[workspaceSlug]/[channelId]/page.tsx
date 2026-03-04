import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChannelById, getWorkspaceChannels, getChannelMembers } from "@/lib/channels";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getWorkspaceMembers } from "@/lib/members";
import { hasPermission } from "@/lib/permissions";
import ChannelChat from "./channel-chat";

export default async function ChannelPage({
  params,
}: {
  params: { workspaceSlug: string; channelId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { data: channel } = await getChannelById(params.channelId);
  if (!channel) redirect(`/${params.workspaceSlug}`);

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const isDm = channel.isDm === 1;

  const [{ data: members }, adminPerm, ownerPerm, { data: allChannels }] =
    await Promise.all([
      getWorkspaceMembers(workspace.id),
      hasPermission(session.user.id, workspace.id, "admin"),
      hasPermission(session.user.id, workspace.id, "owner"),
      getWorkspaceChannels(workspace.id, session.user.id, true),
    ]);

  // For DMs, resolve the other user
  let dmOtherUser: {
    id: string;
    name: string | null;
    email: string;
    avatarColor: string | null;
    profileImage: string | null;
    status: string;
  } | undefined;

  if (isDm) {
    const channelMembersList = await getChannelMembers(channel.id);
    const other = channelMembersList.find((m) => m.userId !== session.user.id);
    if (other) {
      dmOtherUser = other.user;
    }
  }

  return (
    <ChannelChat
      channelId={channel.id}
      channelName={channel.name}
      channelDescription={channel.description}
      workspaceSlug={params.workspaceSlug}
      currentUserId={session.user.id}
      members={(members ?? []).map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarColor: m.user.avatarColor,
        profileImage: m.user.profileImage,
        status: m.user.status,
      }))}
      isArchived={channel.archived === 1}
      isAdmin={!!adminPerm}
      isOwner={!!ownerPerm}
      isDefault={channel.isDefault === 1}
      channels={(allChannels ?? [])
        .filter((c) => c.archived === 0)
        .map((c) => ({ id: c.id, name: c.name }))}
      isDm={isDm}
      dmOtherUser={dmOtherUser}
    />
  );
}
