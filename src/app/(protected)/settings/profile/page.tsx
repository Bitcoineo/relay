import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/user-profile";
import ProfileForm from "./profile-form";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { data: profile } = await getUserProfile(session.user.id);
  if (!profile) redirect("/workspaces");

  return (
    <div className="rounded-lg border border-[#EEEEED] bg-white p-6">
      <h2 className="mb-5 text-base font-semibold text-[#2D2D2D]">
        Profile
      </h2>
      <ProfileForm
        profile={{
          name: profile.name,
          bio: profile.bio,
          profileImage: profile.profileImage,
          websiteUrl: profile.websiteUrl,
          githubUrl: profile.githubUrl,
          twitterUrl: profile.twitterUrl,
          avatarColor: profile.avatarColor,
        }}
      />
    </div>
  );
}
