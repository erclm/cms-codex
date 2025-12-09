'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
  };

  return (
    <main className="mx-auto max-w-lg space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg shadow-black/30">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/"
          className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          ← Back to storefront
        </Link>
      </div>
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          Admin access
        </p>
        <h1 className="text-3xl font-semibold">Login</h1>
        <p className="text-[var(--muted)]">
          Any authenticated user is an admin for this demo. Accounts can be
          created directly in Supabase auth.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="text-[var(--muted)]">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-base text-[var(--foreground)] outline-none ring-0 transition focus:border-[var(--accent)]"
            placeholder="admin@example.com"
          />
        </label>

        <label className="block space-y-2 text-sm">
          <span className="text-[var(--muted)]">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-white/5 px-4 py-3 text-base text-[var(--foreground)] outline-none ring-0 transition focus:border-[var(--accent)]"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent-strong)] px-5 py-3 text-sm font-semibold text-[#0c1a26] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {message && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {message}
        </p>
      )}
    </main>
  );
}
