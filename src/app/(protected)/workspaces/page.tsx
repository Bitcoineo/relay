import { auth, signOut } from "@/auth";
import { getUserWorkspaces } from "@/lib/workspaces";
import WorkspaceList from "./workspace-list";

export default async function WorkspacesPage() {
  const session = await auth();
  const { data: workspaces } = await getUserWorkspaces(session!.user.id);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg-primary)] px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="6" width="6" height="16" rx="2" fill="var(--accent)" />
              <rect x="11" y="3" width="6" height="22" rx="2" fill="var(--accent)" />
              <rect x="20" y="9" width="6" height="13" rx="2" fill="var(--accent)" />
            </svg>
            <span className="text-base font-bold text-[var(--text-primary)]">Relay</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)]">
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
                className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
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
