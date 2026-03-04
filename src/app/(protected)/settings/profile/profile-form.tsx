"use client";

import { useState, useRef } from "react";

interface ProfileFormProps {
  profile: {
    name: string | null;
    bio: string | null;
    profileImage: string | null;
    websiteUrl: string | null;
    githubUrl: string | null;
    twitterUrl: string | null;
    avatarColor: string | null;
  };
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [profileImage, setProfileImage] = useState(
    profile.profileImage || ""
  );
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl || "");
  const [githubUrl, setGithubUrl] = useState(profile.githubUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(profile.twitterUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError("Image must be less than 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio: bio || null,
        profileImage: profileImage || null,
        websiteUrl: websiteUrl || null,
        githubUrl: githubUrl || null,
        twitterUrl: twitterUrl || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div>
        <label className="mb-2 block text-xs font-medium text-[#6B6B6B]">
          Profile photo
        </label>
        <div className="flex items-center gap-4">
          {profileImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profileImage}
              alt=""
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium text-white"
              style={{
                backgroundColor: profile.avatarColor || "#4F46E5",
              }}
            >
              {(name || "U")[0].toUpperCase()}
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-md border border-[#EEEEED] px-3 py-1.5 text-sm text-[#2D2D2D] hover:bg-[#F8F8F7]"
            >
              Upload photo
            </button>
            {profileImage && (
              <button
                type="button"
                onClick={() => setProfileImage("")}
                className="ml-2 text-sm text-[#EB5757] hover:underline"
              >
                Remove
              </button>
            )}
            <p className="mt-1 text-xs text-[#A3A3A3]">Max 500KB, JPG or PNG</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[#6B6B6B]">
          Display name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1 flex items-center justify-between text-xs font-medium text-[#6B6B6B]">
          Bio
          <span
            className={`${bio.length > 200 ? "text-[#EB5757]" : "text-[#A3A3A3]"}`}
          >
            {bio.length}/200
          </span>
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
          placeholder="Tell us about yourself"
        />
      </div>

      {/* URLs */}
      <div>
        <label className="mb-1 block text-xs font-medium text-[#6B6B6B]">
          Website
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#6B6B6B]">
          GitHub
        </label>
        <input
          type="url"
          value={githubUrl}
          onChange={(e) => setGithubUrl(e.target.value)}
          placeholder="https://github.com/username"
          className="w-full rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-[#6B6B6B]">
          Twitter
        </label>
        <input
          type="url"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          placeholder="https://twitter.com/username"
          className="w-full rounded-md border border-[#EEEEED] px-3 py-2 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
        />
      </div>

      {/* Save */}
      {error && <p className="text-sm text-[#EB5757]">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-[#4F46E5] px-4 py-2 text-sm font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {saved && (
          <span className="text-sm text-[#22C55E]">Saved!</span>
        )}
      </div>
    </div>
  );
}
