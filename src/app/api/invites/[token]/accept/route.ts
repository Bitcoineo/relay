import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { acceptInvite } from "@/lib/invites";

export async function POST(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await acceptInvite(
    params.token,
    session.user.id,
    session.user.email
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ data: result.data });
}
