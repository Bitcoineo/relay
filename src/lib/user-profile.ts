import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

type Result<T> = { data: T; error: null } | { data: null; error: string };

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  profileImage: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  twitterUrl: string | null;
  avatarColor: string | null;
  status: string;
}

export async function getUserProfile(
  userId: string
): Promise<Result<UserProfile>> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      name: true,
      email: true,
      bio: true,
      profileImage: true,
      websiteUrl: true,
      githubUrl: true,
      twitterUrl: true,
      avatarColor: true,
      status: true,
    },
  });

  if (!user) {
    return { data: null, error: "User not found" };
  }

  return { data: user, error: null };
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    bio?: string | null;
    profileImage?: string | null;
    websiteUrl?: string | null;
    githubUrl?: string | null;
    twitterUrl?: string | null;
  }
): Promise<Result<UserProfile>> {
  if (data.bio && data.bio.length > 200) {
    return { data: null, error: "Bio must be 200 characters or less" };
  }

  if (
    data.profileImage &&
    data.profileImage !== "" &&
    !data.profileImage.startsWith("data:image/")
  ) {
    return { data: null, error: "Invalid image format" };
  }

  if (data.profileImage && data.profileImage.length > 500 * 1024) {
    return { data: null, error: "Image must be less than 500KB" };
  }

  await db
    .update(users)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bio !== undefined && { bio: data.bio || null }),
      ...(data.profileImage !== undefined && {
        profileImage: data.profileImage || null,
      }),
      ...(data.websiteUrl !== undefined && {
        websiteUrl: data.websiteUrl || null,
      }),
      ...(data.githubUrl !== undefined && {
        githubUrl: data.githubUrl || null,
      }),
      ...(data.twitterUrl !== undefined && {
        twitterUrl: data.twitterUrl || null,
      }),
    })
    .where(eq(users.id, userId));

  return getUserProfile(userId);
}
