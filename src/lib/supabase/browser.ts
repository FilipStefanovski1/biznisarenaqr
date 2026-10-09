"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

let realtimeClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

/** Session-less client used only to receive scoreboard broadcasts. */
export function getRealtimeClient(): SupabaseClient {
  realtimeClient ??= createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "ba-realtime", // separate from the admin login client
    },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return realtimeClient;
}

/** Cookie-backed auth client for the admin login form. */
export function getAuthBrowserClient(): SupabaseClient {
  authClient ??= createBrowserClient(url, publishableKey);
  return authClient;
}
