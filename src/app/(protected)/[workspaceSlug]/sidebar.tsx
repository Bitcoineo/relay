"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSocket } from "./socket-provider";

interface OnlineMember {
  id: string;
  name: string | null;
  email: string;
  avatarColor: string | null;
}

interface SidebarProps {
  workspaceName: string;
  workspaceSlug: string;
  channels: Array<{
    id: string;
    name: string;
    isDefault: boolean;
    archived: boolean;
  }>;
  isAdmin: boolean;
  userName: string;
  avatarColor: string;
  onlineCount: number;
  onlineMembers: OnlineMember[];
}

export default function Sidebar({
  workspaceName,
  workspaceSlug,
  channels,
  isAdmin,
  userName,
  avatarColor,
  onlineCount: initialOnlineCount,
  onlineMembers,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const socket = useSocket();
  const [showForm, setShowForm] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [onlineCount, setOnlineCount] = useState(initialOnlineCount);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [showArchived, setShowArchived] = useState(false);
  const membersActive = pathname === `/${workspaceSlug}/members`;
  const activeChannels = channels.filter((c) => !c.archived);
  const archivedChannels = channels.filter((c) => c.archived);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Listen for presence updates to update online count
  useEffect(() => {
    if (!socket) return;

    const handlePresence = (data: { userId: string; status: string }) => {
      setOnlineCount((prev) =>
        data.status === "online"
          ? prev + 1
          : data.status === "offline"
            ? Math.max(0, prev - 1)
            : prev
      );
    };

    socket.on("presence_update", handlePresence);
    return () => {
      socket.off("presence_update", handlePresence);
    };
  }, [socket]);

  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/workspaces/${workspaceSlug}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: channelName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to create channel");
      setLoading(false);
      return;
    }

    setChannelName("");
    setShowForm(false);
    setLoading(false);
    router.refresh();
  }

  async function handleSignOut() {
    const res = await fetch("/api/auth/signout", { method: "POST" });
    if (res.ok) {
      window.location.href = "/auth/signin";
    }
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-[#EEEEED] bg-white shadow-sm md:hidden"
      >
        <svg
          className="h-4 w-4 text-[#2D2D2D]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? "fixed inset-y-0 left-0 z-40 flex" : "hidden"
        } w-64 flex-col border-r border-[#EEEEED] bg-[#F8F8F7] md:relative md:flex`}
      >
        {/* Logo */}
        <div className="border-b border-[#EEEEED] px-4 py-3">
          <Link href="/workspaces" className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="6" width="6" height="16" rx="2" fill="#4F46E5" />
              <rect x="11" y="3" width="6" height="22" rx="2" fill="#4F46E5" />
              <rect x="20" y="9" width="6" height="13" rx="2" fill="#4F46E5" />
            </svg>
            <span className="text-sm font-bold text-[#2D2D2D]">Relay</span>
          </Link>
        </div>

        {/* Workspace header */}
        <div className="p-4">
          <Link
            href="/workspaces"
            className="flex items-center gap-1 text-xs text-[#A3A3A3] transition-colors hover:text-[#2D2D2D]"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            All Workspaces
          </Link>
          <h2 className="mt-3 flex items-center gap-1 truncate text-sm font-bold text-[#2D2D2D]">
            {workspaceName}
            <svg
              className="h-3 w-3 flex-shrink-0 text-[#A3A3A3]"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </h2>
          <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
            {onlineCount} online
          </p>
        </div>

        {/* Channels */}
        <nav className="flex-1 overflow-y-auto px-3">
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
              Channels
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowForm(true)}
                className="text-[#A3A3A3] transition-colors hover:text-[#2D2D2D]"
                title="Create channel"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleCreateChannel} className="mt-2 px-2">
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="w-full rounded-md border border-[#EEEEED] bg-white px-2 py-1.5 text-sm text-[#2D2D2D] focus:border-[#4F46E5] focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                placeholder="channel-name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setShowForm(false);
                    setChannelName("");
                    setError("");
                  }
                }}
              />
              {error && (
                <p className="mt-1 text-xs text-[#EB5757]">{error}</p>
              )}
              <div className="mt-1.5 flex gap-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded bg-[#4F46E5] px-2 py-1 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
                >
                  {loading ? "..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setChannelName("");
                    setError("");
                  }}
                  className="rounded px-2 py-1 text-xs text-[#6B6B6B] hover:bg-[#EEEEED]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <ul className="mt-1 space-y-0.5">
            {activeChannels.map((channel) => {
              const channelPath = `/${workspaceSlug}/${channel.id}`;
              const isActive = pathname === channelPath;
              return (
                <li key={channel.id}>
                  <Link
                    href={channelPath}
                    className={`flex items-center gap-2 rounded-md py-2 text-sm transition-all duration-120 ${
                      isActive
                        ? "translate-x-0.5 border-l-[3px] border-[#4F46E5] bg-white pl-[calc(0.5rem-3px)] pr-2 font-medium text-[#4F46E5]"
                        : "px-2 text-[#6B6B6B] hover:translate-x-0.5 hover:bg-[#F0F0EF] hover:text-[#2D2D2D]"
                    }`}
                  >
                    <span
                      className={`text-sm ${isActive ? "text-[#4F46E5]" : "text-[#A3A3A3]"}`}
                    >
                      #
                    </span>
                    <span className="truncate">{channel.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {activeChannels.length === 0 && (
            <p className="mt-2 px-2 text-sm text-[#A3A3A3]">
              No channels yet
            </p>
          )}

          {/* Archived channels */}
          {archivedChannels.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowArchived(!showArchived)}
                className="flex w-full items-center gap-1 px-2 text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3] hover:text-[#6B6B6B]"
              >
                <svg
                  className={`h-3 w-3 transition-transform ${showArchived ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
                Archived ({archivedChannels.length})
              </button>
              {showArchived && (
                <ul className="mt-1 space-y-0.5">
                  {archivedChannels.map((channel) => {
                    const channelPath = `/${workspaceSlug}/${channel.id}`;
                    const isActive = pathname === channelPath;
                    return (
                      <li key={channel.id}>
                        <Link
                          href={channelPath}
                          className={`flex items-center gap-2 rounded-md py-2 text-sm transition-all duration-120 ${
                            isActive
                              ? "translate-x-0.5 border-l-[3px] border-[#A3A3A3] bg-white pl-[calc(0.5rem-3px)] pr-2 font-medium text-[#A3A3A3]"
                              : "px-2 text-[#A3A3A3] hover:translate-x-0.5 hover:bg-[#F0F0EF]"
                          }`}
                        >
                          <span className="text-sm text-[#D1D5DB]">#</span>
                          <span className="truncate opacity-60">{channel.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* Members section */}
          <div className="mt-4 border-t border-[#EEEEED] pt-4">
            <Link
              href={`/${workspaceSlug}/members`}
              className={`flex items-center gap-2 rounded-md py-2 text-sm transition-all duration-120 ${
                membersActive
                  ? "translate-x-0.5 border-l-[3px] border-[#4F46E5] bg-white pl-[calc(0.5rem-3px)] pr-2 font-medium text-[#4F46E5]"
                  : "px-2 text-[#6B6B6B] hover:translate-x-0.5 hover:bg-[#F0F0EF] hover:text-[#2D2D2D]"
              }`}
            >
              <svg
                className={`h-4 w-4 flex-shrink-0 ${membersActive ? "text-[#4F46E5]" : "text-[#A3A3A3]"}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              Members
            </Link>
          </div>

          {/* Online members */}
          {onlineMembers.length > 0 && (
            <div className="mt-3 px-2">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[#A3A3A3]">
                Online
              </p>
              <ul className="space-y-1">
                {onlineMembers.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 px-1 py-1"
                  >
                    <div className="relative">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-white"
                        style={{
                          backgroundColor: m.avatarColor || "#4F46E5",
                        }}
                      >
                        {(m.name || m.email)[0].toUpperCase()}
                      </div>
                      <span className="absolute -bottom-px -right-px h-1.5 w-1.5 rounded-full border border-[#F8F8F7] bg-[#22C55E]" />
                    </div>
                    <span className="truncate text-xs text-[#6B6B6B]">
                      {m.name || m.email.split("@")[0]}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href={`/${workspaceSlug}/members`}
                className="mt-1 block px-1 text-[11px] text-[#A3A3A3] transition-colors hover:text-[#4F46E5]"
              >
                View all →
              </Link>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-[#EEEEED] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {userName[0].toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#F8F8F7] bg-[#22C55E]" />
              </div>
              <span className="truncate text-sm text-[#2D2D2D]">
                {userName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings/profile"
                className="text-xs text-[#A3A3A3] transition-colors hover:text-[#4F46E5]"
                title="Profile settings"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs text-[#A3A3A3] transition-colors hover:text-[#2D2D2D]"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
