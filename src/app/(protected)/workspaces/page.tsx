import { auth, signOut } from "@/auth";
import { getUserWorkspaces } from "@/lib/workspaces";
import WorkspaceList from "./workspace-list";

export default async function WorkspacesPage() {
  const session = await auth();
  const { data: workspaces } = await getUserWorkspaces(session!.user.id);

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      <header className="border-b border-[#EEEEED] bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="6" width="6" height="16" rx="2" fill="#4F46E5" />
              <rect x="11" y="3" width="6" height="22" rx="2" fill="#4F46E5" />
              <rect x="20" y="9" width="6" height="13" rx="2" fill="#4F46E5" />
            </svg>
            <span className="text-sm font-bold text-[#2D2D2D]">Relay</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#6B6B6B]">
              {session!.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/auth/signin" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-[#6B6B6B] transition-colors hover:text-[#2D2D2D]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <WorkspaceList initialWorkspaces={workspaces ?? []} />
      </main>
    </div>
  );
}
