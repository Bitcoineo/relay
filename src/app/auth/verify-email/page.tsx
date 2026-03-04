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
      ? "Your verification link has expired. Please request a new one."
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

      setMessage("Verification email sent! Check your inbox.");
      setCooldown(60);
    } catch {
      setError("Failed to resend. Please try again.");
      setResendDisabled(false);
    }
  }, []);

  return (
    <div className="w-full max-w-sm rounded-md p-6 text-center animate-fadeInUp">
      {/* Mail icon */}
      <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-[#4F46E5]"
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
        <span className="text-lg font-bold text-[#2D2D2D]">Relay</span>
      </Link>

      <h1 className="text-2xl font-bold text-[#2D2D2D] mb-2">
        Check your email
      </h1>
      <p className="text-[#6B6B6B] text-sm mb-6">
        We sent a verification link to your email address. Click the link to
        verify your account.
      </p>

      {error && (
        <div className="text-sm text-[#EB5757] bg-red-50 px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {message && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded mb-4">
          {message}
        </div>
      )}

      <button
        onClick={handleResend}
        disabled={resendDisabled}
        className="w-full bg-[#4F46E5] hover:bg-[#4338CA] hover:shadow-md active:scale-[0.97] text-white rounded-md px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50 focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2"
      >
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : "Resend verification email"}
      </button>

      <p className="text-xs text-[#A3A3A3] mt-4">
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
