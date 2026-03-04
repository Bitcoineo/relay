import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getChannelById } from "@/lib/channels";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getWorkspaceMembers } from "@/lib/members";
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
  const { data: members } = await getWorkspaceMembers(workspace!.id);

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
        status: m.user.status,
      }))}
    />
  );
}
