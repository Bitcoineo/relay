import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { getWorkspaceChannels } from "@/lib/channels";

export default async function WorkspacePage({
  params,
}: {
  params: { workspaceSlug: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) redirect("/workspaces");

  const { data: channels } = await getWorkspaceChannels(
    workspace.id,
    session.user.id
  );

  // Find the default channel and redirect to it
  const defaultChannel = channels?.find((c) => c.isDefault === 1);
  if (defaultChannel) {
    redirect(`/${params.workspaceSlug}/${defaultChannel.id}`);
  }

  // If no default channel, redirect to first available
  if (channels && channels.length > 0) {
    redirect(`/${params.workspaceSlug}/${channels[0].id}`);
  }

  // No channels at all — shouldn't happen (workspace creation makes #general)
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-[var(--text-secondary)]">No channels available.</p>
    </div>
  );
}
