"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    avatarColor: string | null;
    status: string;
  };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  invitedBy: { id: string; name: string | null; email: string };
}

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-[#2D2D2D] text-white",
  admin: "bg-[#F8F8F7] text-[#2D2D2D] border border-[#EEEEED]",
  member: "bg-[#F8F8F7] text-[#6B6B6B]",
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-[#22C55E]",
  idle: "bg-[#F59E0B]",
  offline: "bg-[#D1D5DB]",
};

export default function MemberList({
  members,
  pendingInvites,
  currentUserRole,
  currentUserId,
  workspaceSlug,
}: {
  members: Member[];
  pendingInvites: Invite[];
  currentUserRole: string;
  currentUserId: string;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const isAdmin = currentUserRole === "admin" || currentUserRole === "owner";
  const isOwner = currentUserRole === "owner";

  // Invite form state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "admin">("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  // Member action state
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const apiBase = `/api/workspaces/${workspaceSlug}`;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteLink("");

    const res = await fetch(`${apiBase}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    const data = await res.json();

    if (!res.ok) {
      setInviteError(data.error || "Failed to send invite");
      setInviteLoading(false);
      return;
    }

    const link = `${window.location.origin}/invite/${data.data.token}`;
    setInviteLink(link);
    setInviteEmail("");
    setInviteLoading(false);
    router.refresh();
  }

  async function handleCancelInvite(inviteId: string) {
    const res = await fetch(`${apiBase}/invites/${inviteId}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    const res = await fetch(`${apiBase}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) router.refresh();
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    const res = await fetch(`${apiBase}/members/${memberId}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
    setRemovingId(null);
    setConfirmRemoveId(null);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  const onlineCount = members.filter((m) => m.user.status === "online").length;

  return (
    <div className="space-y-8">
      {/* Online count */}
      <p className="text-sm text-[#6B6B6B]">
        {onlineCount} of {members.length} members online
      </p>

      {/* Invite Form */}
      {isAdmin && (
        <div>
          {!showInvite ? (
            <button
              onClick={() => setShowInvite(true)}
              className="rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97]"
            >
              Invite member
            </button>
          ) : (
            <div className="rounded-md border border-[#EEEEED] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#2D2D2D]">Invite</h3>
              <form onSubmit={handleInvite} className="mt-3 flex items-end gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="block w-full rounded-md border border-[#EEEEED] px-3 py-2.5 text-sm transition-all duration-150 focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                    placeholder="Email address"
                    autoFocus
                  />
                </div>
                <div>
                  <select
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as "member" | "admin")
                    }
                    className="block rounded-md border border-[#EEEEED] px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="rounded-md bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97] disabled:opacity-50"
                >
                  {inviteLoading ? "Sending..." : "Send invite"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInvite(false);
                    setInviteError("");
                    setInviteLink("");
                  }}
                  className="rounded-md border border-[#EEEEED] px-4 py-2.5 text-sm text-[#6B6B6B] transition-all duration-150 hover:bg-[#F8F8F7] hover:shadow-sm active:scale-[0.97]"
                >
                  Cancel
                </button>
              </form>
              {inviteError && (
                <p className="mt-2 text-sm text-[#EB5757]">{inviteError}</p>
              )}
              {inviteLink && (
                <div className="mt-3 rounded-md border border-[#C2E5DC] bg-[#E8F5F1] p-3">
                  <p className="text-sm text-[#4DAB9A]">
                    Invite created. Share the link.
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="flex-1 truncate rounded border border-[#C2E5DC] bg-white px-2 py-1 text-xs text-[#2D2D2D]">
                      {inviteLink}
                    </code>
                    <button
                      onClick={() => copyToClipboard(inviteLink)}
                      className="rounded bg-[#4F46E5] px-3 py-1 text-xs font-medium text-white hover:bg-[#4338CA]"
                    >
                      Copy link
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending Invites */}
      {isAdmin && pendingInvites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#2D2D2D]">
            Pending Invites
            <span className="ml-2 text-xs font-normal text-[#A3A3A3]">
              {pendingInvites.length}
            </span>
          </h3>
          <div className="mt-2 space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-[#EEEEED] bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {invite.email}
                  </p>
                  <p className="text-xs text-[#A3A3A3]">
                    Invited as{" "}
                    <span className="capitalize">{invite.role}</span>
                    {" by "}
                    {invite.invitedBy.name || invite.invitedBy.email}
                    {" · Expires "}
                    {new Date(invite.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCancelInvite(invite.id)}
                  className="rounded px-3 py-1.5 text-sm text-[#EB5757] transition-all duration-150 hover:bg-[#FBE9E9] active:scale-[0.97]"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members List */}
      <div>
        <h3 className="text-sm font-semibold text-[#2D2D2D]">
          Members
          <span className="ml-2 text-xs font-normal text-[#A3A3A3]">
            {members.length}
          </span>
        </h3>
        <div className="mt-2 space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-md border border-[#EEEEED] bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium text-white"
                    style={{
                      backgroundColor: m.user.avatarColor || "#4F46E5",
                    }}
                  >
                    {(m.user.name || m.user.email)[0].toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${STATUS_DOT[m.user.status] || STATUS_DOT.offline}`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2D2D]">
                    {m.user.name || m.user.email}
                    {m.user.id === currentUserId && (
                      <span className="ml-1 text-xs text-[#A3A3A3]">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#A3A3A3]">{m.user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isOwner && m.role !== "owner" ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="rounded border border-[#EEEEED] px-2 py-1 text-xs text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      ROLE_BADGE[m.role] || ROLE_BADGE.member
                    }`}
                  >
                    {m.role}
                  </span>
                )}

                {isAdmin &&
                  m.role !== "owner" &&
                  m.user.id !== currentUserId && (
                    <>
                      {confirmRemoveId === m.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            disabled={removingId === m.id}
                            className="rounded bg-[#EB5757] px-2 py-1 text-xs font-medium text-white transition-all duration-150 hover:bg-[#D14343] active:scale-[0.97] disabled:opacity-50"
                          >
                            {removingId === m.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmRemoveId(null)}
                            className="rounded px-2 py-1 text-xs text-[#6B6B6B] hover:bg-[#F0F0EF]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemoveId(m.id)}
                          className="rounded px-2 py-1 text-xs text-[#EB5757] transition-all duration-150 hover:bg-[#FBE9E9] active:scale-[0.97]"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
