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
              <path d="M5 2h18a3 3 0 013 3v11a3 3 0 01-3 3h-9l-4 5v-5H5a3 3 0 01-3-3V5a3 3 0 013-3z" fill="var(--accent)" />
              <path d="M15 5L11 11h2.5L12.5 16 17 10h-2.5L15 5z" fill="white" />
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
