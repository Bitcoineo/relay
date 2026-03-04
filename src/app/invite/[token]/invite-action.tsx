"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InviteData {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  workspace: { id: string; name: string; slug: string };
  invitedBy: { name: string | null };
}

export default function InviteAction({
  invite,
  error,
  isLoggedIn,
  userEmail,
  token,
}: {
  invite: InviteData | null;
  error: string | null;
  isLoggedIn: boolean;
  userEmail: string | null;
  token: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [declined, setDeclined] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setActionError("");

    const res = await fetch(`/api/invites/${token}/accept`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setActionError(data.error || "Failed to accept invite");
      setLoading(false);
      return;
    }

    router.push(`/${data.data.workspaceSlug}`);
  }

  async function handleDecline() {
    setLoading(true);
    setActionError("");

    const res = await fetch(`/api/invites/${token}/decline`, {
      method: "POST",
    });

    if (!res.ok) {
      const data = await res.json();
      setActionError(data.error || "Failed to decline invite");
      setLoading(false);
      return;
    }

    setDeclined(true);
    setLoading(false);
  }

  // Error / not found
  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FBE9E9]">
            <svg className="h-6 w-6 text-[#EB5757]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[#2D2D2D]">Invite not found</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">{error || "This link is expired or doesn't exist."}</p>
          <Link
            href={isLoggedIn ? "/workspaces" : "/auth/signin"}
            className="mt-6 inline-block rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
          >
            {isLoggedIn ? "Go to workspaces" : "Sign in"}
          </Link>
        </div>
      </div>
    );
  }

  // Already processed
  if (invite.status !== "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <h1 className="text-lg font-semibold text-[#2D2D2D]">
            This invite was already {invite.status}
          </h1>
          <Link
            href={isLoggedIn ? "/workspaces" : "/auth/signin"}
            className="mt-6 inline-block rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
          >
            {isLoggedIn ? "Go to workspaces" : "Sign in"}
          </Link>
        </div>
      </div>
    );
  }

  // Declined confirmation
  if (declined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <h1 className="text-lg font-semibold text-[#2D2D2D]">Declined.</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">You passed on {invite.workspace.name}.</p>
          <Link
            href="/workspaces"
            className="mt-6 inline-block rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
          >
            Go to workspaces
          </Link>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="rounded-md bg-white p-6 text-center">
            <h1 className="text-lg font-semibold text-[#2D2D2D]">You&apos;re invited</h1>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              {invite.invitedBy.name || "Someone"} invited you to{" "}
              <strong className="text-[#2D2D2D]">{invite.workspace.name}</strong>{" "}
              as <span className="font-medium capitalize">{invite.role}</span>.
            </p>
            <Link
              href={`/auth/signin?callbackUrl=/invite/${token}`}
              className="mt-6 inline-block w-full rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
            >
              Sign in to join
            </Link>
            <p className="mt-3 text-xs text-[#A3A3A3]">
              No account?{" "}
              <Link href={`/auth/signup?callbackUrl=/invite/${token}`} className="font-medium text-[#4F46E5] hover:text-[#4338CA]">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Wrong account
  if (userEmail && userEmail.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="rounded-md border border-[#F2C94C]/30 bg-[#FDF6E3] p-6 text-center">
            <h1 className="text-lg font-semibold text-[#2D2D2D]">Wrong account</h1>
            <p className="mt-2 text-sm text-[#6B6B6B]">
              This invite is for <strong className="text-[#2D2D2D]">{invite.email}</strong>, but you&apos;re signed in as{" "}
              <strong className="text-[#2D2D2D]">{userEmail}</strong>.
            </p>
            <Link
              href={`/auth/signin?callbackUrl=/invite/${token}`}
              className="mt-4 inline-block rounded-md border border-[#EEEEED] px-4 py-2 text-sm font-medium text-[#2D2D2D] transition-colors hover:bg-white"
            >
              Switch account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Ready to accept
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm animate-fadeInUp">
        <div className="rounded-md bg-white p-6 text-center">
          <h1 className="text-lg font-semibold text-[#2D2D2D]">Join {invite.workspace.name}</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            {invite.invitedBy.name || "Someone"} invited you as{" "}
            <span className="font-medium capitalize text-[#2D2D2D]">{invite.role}</span>.
          </p>

          {actionError && (
            <p className="mt-3 text-sm text-[#EB5757]">{actionError}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 rounded-md border border-[#EEEEED] px-4 py-2.5 text-sm font-medium text-[#2D2D2D] transition-colors hover:bg-[#F8F8F7] disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-50"
            >
              {loading ? "..." : "Join workspace"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
