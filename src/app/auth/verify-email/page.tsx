"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "expired"
      ? "Your verification link has expired. Request a new one."
      : ""
  );

  // Poll for verification every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/check-verification");
        const data = await res.json();
        if (data.verified) {
          router.push("/workspaces");
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) {
      setResendDisabled(false);
      return;
    }
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    setResendDisabled(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        if (res.status === 429) {
          setCooldown(60);
        }
        return;
      }

      setMessage("Sent. Check your inbox.");
      setCooldown(60);
    } catch {
      setError("Something went wrong. Try again.");
      setResendDisabled(false);
    }
  }, []);

  return (
    <div className="w-full max-w-sm rounded-md p-6 text-center animate-fadeInUp">
      {/* Mail icon */}
      <div className="mx-auto w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-[var(--accent-text)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          />
        </svg>
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2 mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 2h18a3 3 0 013 3v11a3 3 0 01-3 3h-9l-4 5v-5H5a3 3 0 01-3-3V5a3 3 0 013-3z" fill="var(--accent)" />
          <path d="M15 5L11 11h2.5L12.5 16 17 10h-2.5L15 5z" fill="white" />
        </svg>
        <span className="text-3xl font-bold text-[var(--text-primary)]">Relay</span>
      </Link>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
        Check your inbox
      </h1>
      <p className="text-[var(--text-secondary)] text-[15px] mb-6">
        We sent a link to your email. Click it to verify.
      </p>

      {error && (
        <div className="text-sm text-[var(--danger)] bg-[var(--danger-light)] px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="text-sm text-[var(--success)] bg-[var(--success)]/10 px-3 py-2 rounded mb-4">
          {message}
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={resendDisabled}
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.97] text-[var(--text-inverse)] rounded-md px-4 py-3 text-base font-medium transition-all disabled:opacity-50 focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
      >
        {cooldown > 0
          ? `Wait ${cooldown}s`
          : "Resend email"}
      </button>

      <p className="text-xs text-[var(--text-muted)] mt-4">
        The link expires in 24 hours.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
