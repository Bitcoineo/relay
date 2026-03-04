import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/workspaces");
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* ── Nav ── */}
      <nav className="border-b border-[var(--border)] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
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
            <span className="text-lg font-bold text-[var(--text-primary)]">Relay</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-md px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.97]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl animate-fadeInUp">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Messages that move work forward.
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Real-time chat for teams. Channels, mentions, presence &mdash;
            without the bloat.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/auth/signup"
              className="rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.97]"
            >
              Start for free
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-md border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Hero illustration ── */}
      <div className="mx-auto mt-12 mb-4 max-w-lg px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/relay-animation.svg"
          alt="Relay chat interface animation"
          width={480}
          height={320}
          className="w-full rounded-xl border border-[var(--border)] shadow-sm"
        />
      </div>

      {/* ── Feature cards ── */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-light)]">
              <svg
                className="h-5 w-5 text-[var(--accent-text)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              Real-time messaging
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Every message delivered instantly. No refresh needed.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-light)]">
              <svg
                className="h-5 w-5 text-[var(--accent-text)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 10-2.636 6.364M16.5 12V8.25"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              Smart mentions
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              @mention a teammate. If they&apos;re offline, they get an email.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-light)]">
              <svg
                className="h-5 w-5 text-[var(--accent-text)]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              Know who&apos;s here
            </h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Green dot means online. No guessing, no waiting.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-[var(--bg-inverse)] px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-[var(--text-inverse)] sm:text-3xl">
          Your team is one workspace away.
        </h2>
        <Link
          href="/auth/signup"
          className="mt-6 inline-block rounded-md bg-[var(--accent)] px-6 py-3 text-sm font-medium text-[var(--text-inverse)] transition-all hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
        >
          Create workspace
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Built by Bitcoineo</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Bitcoineo"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              GitHub
            </a>
            <a
              href="https://x.com/Bitcoineo"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--text-primary)]"
            >
              X
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
