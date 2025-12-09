'use client';

import { useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type SessionState = "loading" | "authed" | "guest";

export default function AuthOnly({ children, fallback = null }: Props) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<SessionState>("loading");

  // Gate rendering on auth state and keep it in sync with Supabase session changes.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState(data.session ? "authed" : "guest");
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState(session ? "authed" : "guest");
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  if (state !== "authed") {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
