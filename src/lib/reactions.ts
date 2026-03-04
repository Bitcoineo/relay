import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { reactions } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<Result<{ action: "added" | "removed" }>> {
  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.messageId, messageId),
      eq(reactions.userId, userId),
      eq(reactions.emoji, emoji)
    ),
  });

  if (existing) {
    await db.delete(reactions).where(eq(reactions.id, existing.id));
    return { data: { action: "removed" }, error: null };
  }

  await db.insert(reactions).values({ messageId, userId, emoji });
  return { data: { action: "added" }, error: null };
}
