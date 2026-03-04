import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug } from "@/lib/workspaces";
import { isMember } from "@/lib/permissions";
import { getOrCreateDM, getUserDMs } from "@/lib/direct-messages";

export async function POST(
  req: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const memberCheck = await isMember(session.user.id, workspace.id);
  if (!memberCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Verify target user is also a workspace member
  const targetMember = await isMember(userId, workspace.id);
  if (!targetMember) {
    return NextResponse.json({ error: "User is not a workspace member" }, { status: 400 });
  }

  const result = await getOrCreateDM(workspace.id, session.user.id, userId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}

export async function GET(
  _req: Request,
  { params }: { params: { workspaceSlug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await getWorkspaceBySlug(params.workspaceSlug);
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const memberCheck = await isMember(session.user.id, workspace.id);
  if (!memberCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await getUserDMs(workspace.id, session.user.id);

  return NextResponse.json(result.data);
}
