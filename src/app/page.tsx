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
      <nav className="fixed left-1/2 z-50 mt-4 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 rounded-2xl border border-[var(--border)]/50 bg-[var(--bg-primary)]/80 px-6 py-3 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 2h18a3 3 0 013 3v11a3 3 0 01-3 3h-9l-4 5v-5H5a3 3 0 01-3-3V5a3 3 0 013-3z" fill="var(--accent)" />
              <path d="M15 5L11 11h2.5L12.5 16 17 10h-2.5L15 5z" fill="white" />
            </svg>
            <span className="text-xl font-bold text-[var(--text-primary)]">Relay</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--accent)]"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--text-inverse)] transition-all hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
            >
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="px-6 pb-16 pt-28 md:min-h-[70vh] md:flex md:items-center">
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
                className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-inverse)] transition-all duration-150 hover:scale-[1.02] hover:bg-[var(--accent-hover)] hover:shadow-lg active:scale-[0.97]"
              >
                Start for free
              </Link>
              <Link
                href="/auth/signin"
                className="rounded-full border border-[var(--border)] px-6 py-2.5 text-[15px] font-medium text-[var(--text-secondary)] transition-all duration-150 hover:scale-[1.01] hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97]"
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
              style={{ background: "radial-gradient(circle, rgba(13,148,136,0.05) 0%, transparent 70%)" }}
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

      {/* ── Feature cards ── */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 — Real-time (Teal) */}
          <ScrollReveal delay={0}>
            <div className="group h-full rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#0D9488] hover:shadow-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(13,148,136,0.08)] transition-all duration-300 group-hover:bg-[rgba(13,148,136,0.15)] group-hover:scale-110">
                <svg
                  className="h-5 w-5 text-[#0D9488]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
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

          {/* Card 2 — Mentions (Amber) */}
          <ScrollReveal delay={100}>
            <div className="group h-full rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#F59E0B] hover:shadow-lg">
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
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
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

          {/* Card 3 — Presence (Emerald) */}
          <ScrollReveal delay={200}>
            <div className="group h-full rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#10B981] hover:shadow-lg">
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
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
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
          <ScrollReveal delay={300}>
            <div className="group h-full rounded-lg border border-[var(--border)] border-t-2 border-t-transparent bg-[var(--bg-primary)] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-t-[#8B5CF6] hover:shadow-lg">
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
                    d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
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
      <section className="relative overflow-hidden px-6 py-20 text-center" style={{ background: 'linear-gradient(135deg, #0D9488 0%, #134E4A 100%)' }}>
        {/* Subtle radial glow for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(94,234,212,0.18) 0%, transparent 70%)' }}
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
              className="inline-block rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-[#134E4A] transition-all duration-150 hover:scale-[1.02] hover:bg-white/90 hover:shadow-lg active:scale-[0.97]"
            >
              Create a workspace
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
          <span>Built by Bitcoineo</span>
          <span className="text-[var(--border-strong)]">&middot;</span>
          <a
            href="https://github.com/Bitcoineo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://x.com/Bitcoineo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
