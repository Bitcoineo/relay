import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import ThemeToggle from "@/app/components/ThemeToggle";
import ScrollReveal from "@/app/components/ScrollReveal";

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
            <ThemeToggle />
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
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 py-16 md:min-h-[70vh] md:flex md:items-center">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 md:flex-row md:items-center md:gap-16">
          {/* Left — copy (55%) */}
          <div className="animate-fadeInUp text-center md:w-[55%] md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] sm:text-5xl">
              Your team&apos;s conversations. <span className="text-[var(--accent)]">All in one place</span>.
            </h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)]">
              Channels for every project. Know who&apos;s online, who&apos;s mentioned, and what you missed.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 md:justify-start">
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

          {/* Right — illustration (45%) */}
          <div className="relative w-full md:w-[45%]">
            {/* Background blob */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 -z-10 h-[400px] w-[400px] rounded-full"
              style={{ background: "radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)" }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/relay-animation.svg"
              alt="Relay chat interface animation"
              width={480}
              height={320}
              className="animate-float w-full rounded-xl border border-[var(--border)] shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* ── Trust band ── */}
      <section className="border-y border-[var(--border)] px-6 py-4">
        <p className="text-center text-sm text-[var(--text-muted)]">
          Real-time &middot; Open source &middot; Deploy anywhere
        </p>
      </section>

      {/* ── Feature cards ── */}
      <section className="bg-[var(--bg-secondary)] px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — Real-time (Indigo) */}
          <ScrollReveal delay={0}>
            <div className="group rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[var(--accent)] hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(79,70,229,0.08)] transition-all duration-300 group-hover:bg-[rgba(79,70,229,0.15)] group-hover:scale-110">
                <svg
                  className="h-5 w-5 text-[#4F46E5]"
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
              <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
                Instant messages
              </h3>
              <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
                Every message arrives the moment it&apos;s sent. No refreshing, no delays.
              </p>
            </div>
          </ScrollReveal>

          {/* Card 2 — Mentions (Emerald) */}
          <ScrollReveal delay={100} className="lg:mt-4">
            <div className="group rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#10B981] hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(16,185,129,0.08)] transition-all duration-300 group-hover:bg-[rgba(16,185,129,0.15)] group-hover:scale-110">
                <svg
                  className="h-5 w-5 text-[#10B981]"
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
              <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
                Mentions that notify
              </h3>
              <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
                Tag someone with @. If they&apos;re not online, they&apos;ll get an email.
              </p>
            </div>
          </ScrollReveal>

          {/* Card 3 — Presence (Amber) */}
          <ScrollReveal delay={200}>
            <div className="group rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#F59E0B] hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(245,158,11,0.08)] transition-all duration-300 group-hover:bg-[rgba(245,158,11,0.15)] group-hover:scale-110">
                <svg
                  className="h-5 w-5 text-[#F59E0B]"
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
              <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
                See who&apos;s around
              </h3>
              <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
                Green means online. Know when your team is available before you message.
              </p>
            </div>
          </ScrollReveal>

          {/* Card 4 — Workspaces (Violet) */}
          <ScrollReveal delay={300} className="lg:mt-4">
            <div className="group rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#8B5CF6] hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(139,92,246,0.08)] transition-all duration-300 group-hover:bg-[rgba(139,92,246,0.15)] group-hover:scale-110">
                <svg
                  className="h-5 w-5 text-[#8B5CF6]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-[var(--text-primary)]">
                Workspaces for every team
              </h3>
              <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
                Create a workspace, invite your team, organize channels by project.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative overflow-hidden px-6 py-20 text-center" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #1e1b4b 100%)' }}>
        {/* Subtle radial glow for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(129,140,248,0.18) 0%, transparent 70%)' }}
        />
        {/* Floating particles */}
        <div aria-hidden="true" className="particle particle-1" />
        <div aria-hidden="true" className="particle particle-2" />
        <div aria-hidden="true" className="particle particle-3" />
        <div aria-hidden="true" className="particle particle-4" />
        <div aria-hidden="true" className="particle particle-5" />

        <ScrollReveal>
          <h2 className="text-2xl font-bold text-[var(--text-inverse)] sm:text-3xl">
            Start a conversation that moves work forward.
          </h2>
          <div className="mt-6 flex flex-col items-center gap-2">
            <Link
              href="/auth/signup"
              className="inline-block rounded-md bg-white px-6 py-3 text-sm font-medium text-[#1e1b4b] transition-all hover:bg-white/90 hover:shadow-lg active:scale-[0.97]"
            >
              Create a workspace
            </Link>
            <a
              href="https://github.com/Bitcoineo/relay"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              View on GitHub &rarr;
            </a>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-6 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>Built by Bitcoineo</span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Bitcoineo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://x.com/Bitcoineo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
