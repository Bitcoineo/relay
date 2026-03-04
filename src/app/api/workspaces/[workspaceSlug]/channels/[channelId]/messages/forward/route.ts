import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { hasPermission } from "@/lib/permissions";
import { forwardMessage } from "@/lib/messages";
import { db } from "@/db";
import { channelMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: { workspaceSlug: string; channelId: string } }
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
  const { messageId, targetChannelId } = body;
  if (!messageId || !targetChannelId) {
    return NextResponse.json(
      { error: "messageId and targetChannelId required" },
      { status: 400 }
    );
  }

  // Check membership in target channel
  const targetMember = await db.query.channelMembers.findFirst({
    where: and(
      eq(channelMembers.channelId, targetChannelId),
      eq(channelMembers.userId, session.user.id)
    ),
  });
  if (!targetMember) {
    return NextResponse.json(
      { error: "Not a member of the target channel" },
      { status: 403 }
    );
  }

  const result = await forwardMessage(
    messageId,
    targetChannelId,
    session.user.id
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
