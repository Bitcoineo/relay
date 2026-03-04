import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { hasPermission } from "@/lib/permissions";
import { getPinnedMessages } from "@/lib/messages";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: { workspaceSlug: string; channelId: string };
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const member = await hasPermission(session.user.id, workspace.id, "member");
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getPinnedMessages(params.channelId);

  return NextResponse.json(result.data);
}
