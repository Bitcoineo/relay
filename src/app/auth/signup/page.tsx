"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Auto sign-in after account creation
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Account created but sign-in failed. Please sign in."
        );
        setLoading(false);
        return;
      }

      router.push("/auth/verify-email");
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/workspaces" });
  };

  return (
    <div className="w-full max-w-sm rounded-md p-6 animate-fadeInUp">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2 mb-6">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M5 2h18a3 3 0 013 3v11a3 3 0 01-3 3h-9l-4 5v-5H5a3 3 0 01-3-3V5a3 3 0 013-3z" fill="var(--accent)" />
          <path d="M15.5 6L11 13h3.5L13 19l6-7.5h-3.5L15.5 6z" fill="white" />
        </svg>
        <span className="text-xl font-bold text-[var(--text-primary)]">Relay</span>
      </Link>

      <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-1">
        Create your account
      </h1>
      <p className="text-[var(--text-secondary)] text-[15px] text-center mb-6">
        Free. No credit card.
      </p>

      {error && (
        <div className="text-sm text-[var(--danger)] bg-[var(--danger-light)] px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-2 border border-[var(--border)] rounded-md px-4 py-3 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] hover:shadow-sm active:scale-[0.97] transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-[var(--border)]" />
        <span className="text-xs text-[var(--text-muted)]">or</span>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      <form onSubmit={handleSignUp} className="space-y-4">
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:shadow-md active:scale-[0.97] text-[var(--text-inverse)] rounded-md px-4 py-3 text-base font-medium transition-all disabled:opacity-50 focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        >
          {loading ? "Setting up..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-[15px] text-[var(--text-secondary)] mt-6">
        Already have one?{" "}
        <Link
          href="/auth/signin"
          className="text-[var(--accent-text)] hover:text-[var(--accent-text)] hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
