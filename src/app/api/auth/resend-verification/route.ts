import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.emailVerified === 1) {
    return NextResponse.json(
      { error: "Email already verified" },
      { status: 400 }
    );
  }

  // Rate limiting: check most recent token's createdAt
  const recentToken = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.userId, user.id),
  });

  if (recentToken) {
    const lastSent = new Date(recentToken.createdAt).getTime();
    const now = Date.now();
    if (now - lastSent < 60_000) {
      const secondsLeft = Math.ceil((60_000 - (now - lastSent)) / 1000);
      return NextResponse.json(
        {
          error: `Please wait ${secondsLeft}s before requesting another email`,
        },
        { status: 429 }
      );
    }

    // Delete old tokens
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id));
  }

  // Generate new token (24hr expiry)
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt,
  });

  await sendVerificationEmail(user.email, user.name || "", token);

  return NextResponse.json({ success: true });
}
