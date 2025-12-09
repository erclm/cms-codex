'use client';

import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../types";

let client:
  | ReturnType<typeof createBrowserClient<Database>>
  | undefined;

export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Cache a single browser client instance so components share auth/session state.
  client = createBrowserClient<Database>(url, anonKey);
  return client;
}
