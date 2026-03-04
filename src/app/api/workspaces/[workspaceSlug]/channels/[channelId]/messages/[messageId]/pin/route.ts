import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { hasPermission } from "@/lib/permissions";
import { pinMessage, unpinMessage } from "@/lib/messages";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";

export async function PATCH(
  _req: Request,
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

  const member = await hasPermission(session.user.id, workspace.id, "admin");
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, params.messageId),
  });

  if (!message || message.channelId !== params.channelId) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const result = message.pinnedAt
    ? await unpinMessage(params.messageId)
    : await pinMessage(params.messageId, session.user.id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
