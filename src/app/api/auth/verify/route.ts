import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, emailVerificationTokens } from "@/db/schema";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=invalid-token", req.url)
    );
  }

  const tokenRecord = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.token, token),
  });

  if (!tokenRecord) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=invalid-token", req.url)
    );
  }

  // Check expiry
  if (new Date(tokenRecord.expiresAt) < new Date()) {
    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, tokenRecord.id));

    return NextResponse.redirect(
      new URL("/auth/verify-email?error=expired", req.url)
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRecord.userId),
  });

  if (!user) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=invalid-token", req.url)
    );
  }

  // Mark email as verified
  await db
    .update(users)
    .set({ emailVerified: 1 })
    .where(eq(users.id, user.id));

  // Delete all verification tokens for this user
  await db
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, user.id));

  // Send welcome email (fire-and-forget)
  sendWelcomeEmail(user.email, user.name || "").catch(console.error);

  return NextResponse.redirect(new URL("/workspaces", req.url));
}
