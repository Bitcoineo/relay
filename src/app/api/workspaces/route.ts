import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createWorkspace, getUserWorkspaces } from "@/lib/workspaces";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  const result = await createWorkspace(session.user.id, name);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getUserWorkspaces(session.user.id);

  return NextResponse.json(result.data);
}
