"use client";

import { useState, useEffect, useRef } from "react";

interface ProfilePopupProps {
  userId: string;
  avatarColor: string;
  userName: string;
  status: string;
  position: { top: number; left: number };
  onClose: () => void;
}

interface ProfileData {
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

export default function ProfilePopup({
  userId,
  avatarColor,
  userName,
  status,
  position,
  onClose,
}: ProfilePopupProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/user/profile?userId=${userId}`)
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const statusColor =
    status === "online"
      ? "bg-[var(--success)]"
      : status === "idle"
        ? "bg-[var(--warning)]"
        : "bg-[var(--border-strong)]";

  return (
    <div
      ref={ref}
      className="fixed z-50 w-64 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-4 shadow-xl"
      style={{ top: position.top, left: position.left }}
    >
      {/* Avatar */}
      <div className="flex items-center gap-3">
        <div className="relative">
          {profile?.profileImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={profile.profileImage}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-medium text-white"
              style={{ backgroundColor: avatarColor }}
            >
              {userName[0].toUpperCase()}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--status-dot-border)] ${statusColor}`}
          />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">{userName}</p>
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${statusColor}`} />
            <span className="text-[13px] capitalize text-[var(--text-muted)]">{status === "online" ? "Online" : status === "idle" ? "Idle" : "Offline"}</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="mt-3 text-[13px] text-[var(--text-secondary)]">{profile.bio}</p>
      )}

      {/* Links */}
      {profile && (profile.websiteUrl || profile.githubUrl || profile.twitterUrl) && (
        <div className="mt-3 flex gap-2 border-t border-[var(--border)] pt-3">
          {profile.websiteUrl && (
            <a
              href={profile.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--accent-text)]"
              title="Website"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </a>
          )}
          {profile.githubUrl && (
            <a
              href={profile.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="GitHub"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
          {profile.twitterUrl && (
            <a
              href={profile.twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] hover:text-[#1DA1F2]"
              title="Twitter"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {profile?.email && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">{profile.email}</p>
      )}
    </div>
  );
}
