'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type SessionState = "loading" | "authed" | "guest";

export default function StorefrontNav() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [sessionState, setSessionState] =
    useState<SessionState>("loading");

  // Subscribe to Supabase auth changes so the nav reacts to login/logout immediately.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session ? "authed" : "guest");
    });

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionState(session ? "authed" : "guest");
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionState("guest");
    router.refresh();
  };

  return (
    <nav
      aria-label="Storefront navigation"
      className="panel-lift card-mesh flex items-center justify-between rounded-2xl px-4 py-3 sm:px-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-[#84f0da] via-[#6bd6f4] to-[#54beff] text-[#041321] shadow-[0_12px_24px_rgba(74,225,174,0.35)]">
          <span className="text-lg font-black leading-none">NM</span>
        </div>
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[var(--muted)]">
            Night Market
          </p>
          <p className="text-sm font-semibold">Everyday goods and fresh drops</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold">
        {sessionState === "authed" && (
          <Link
            href="/admin"
            className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-[#0c1a26] shadow-sm shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/40"
          >
            Admin dashboard
          </Link>
        )}
        {sessionState !== "authed" && (
          <Link
            href="/login"
            className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Login
          </Link>
        )}
        {sessionState === "authed" && (
          <button
            onClick={handleLogout}
            className="rounded-full border border-[var(--border)] px-4 py-2 transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}
