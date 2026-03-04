import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getWorkspaceBySlug, deleteWorkspace } from "@/lib/workspaces";
import { hasPermission } from "@/lib/permissions";

export async function DELETE(
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

  const member = await hasPermission(session.user.id, workspace.id, "owner");
  if (!member) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await deleteWorkspace(workspace.id, session.user.id);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data);
}
