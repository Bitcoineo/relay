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
      setActionError(data.error || "Something went wrong. Try again.");
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
      setActionError(data.error || "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    setDeclined(true);
    setLoading(false);
  }

  // Error / not found
  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-light)]">
            <svg className="h-6 w-6 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Invite not found</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{error || "This invite has expired or doesn't exist."}</p>
          <Link
            href={isLoggedIn ? "/workspaces" : "/auth/signin"}
            className="mt-6 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">
            This invite was already {invite.status}
          </h1>
          <Link
            href={isLoggedIn ? "/workspaces" : "/auth/signin"}
            className="mt-6 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-sm animate-fadeInUp text-center">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Declined</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">You declined the invite to {invite.workspace.name}.</p>
          <Link
            href="/workspaces"
            className="mt-6 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="rounded-md bg-[var(--bg-primary)] p-6 text-center">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Join {invite.workspace.name}</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {invite.invitedBy.name || "Someone"} invited you as{" "}
              <span className="font-medium capitalize">{invite.role}</span>.
            </p>
            <Link
              href={`/auth/signin?callbackUrl=/invite/${token}`}
              className="mt-6 inline-block w-full rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
            >
              Sign in to accept this invite
            </Link>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              No account?{" "}
              <Link href={`/auth/signup?callbackUrl=/invite/${token}`} className="font-medium text-[var(--accent-text)] hover:text-[var(--accent-hover)]">
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-sm animate-fadeInUp">
          <div className="rounded-md border border-[var(--warning)]/30 bg-[var(--warning)]/5 p-6 text-center">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Wrong account</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              This invite is for <strong className="text-[var(--text-primary)]">{invite.email}</strong>, but you&apos;re signed in as{" "}
              <strong className="text-[var(--text-primary)]">{userEmail}</strong>.
            </p>
            <Link
              href={`/auth/signin?callbackUrl=/invite/${token}`}
              className="mt-4 inline-block rounded-full border border-[var(--border)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-primary)] transition-all duration-150 hover:scale-[1.01] hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97]"
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
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-sm animate-fadeInUp">
        <div className="rounded-md bg-[var(--bg-primary)] p-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Join {invite.workspace.name}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {invite.invitedBy.name || "Someone"} invited you as {invite.role}.
          </p>

          {actionError && (
            <p className="mt-3 text-sm text-[var(--danger)]">{actionError}</p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleDecline}
              disabled={loading}
              className="flex-1 rounded-full border border-[var(--border)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:scale-[1.01] hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97] disabled:opacity-50"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
            >
              {loading ? "..." : "Join workspace"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
