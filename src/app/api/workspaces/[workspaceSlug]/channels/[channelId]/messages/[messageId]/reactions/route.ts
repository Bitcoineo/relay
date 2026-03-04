import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { hasPermission } from "@/lib/permissions";
import { toggleReaction } from "@/lib/reactions";

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: {
      workspaceSlug: string;
      channelId: string;
      messageId: string;
    };
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

  const body = await req.json();
  const { emoji } = body;
  if (!emoji) {
    return NextResponse.json({ error: "Emoji required" }, { status: 400 });
  }

  const result = await toggleReaction(params.messageId, session.user.id, emoji);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
