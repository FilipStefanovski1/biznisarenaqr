import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverEnv } from "@/lib/env";

const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: "no-store" });

const statelessAuth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

let serviceClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

/** Secret-key client. Only used for voter RPCs after the signed cookie was verified. */
export function getServiceClient(): SupabaseClient {
  serviceClient ??= createClient(serverEnv.supabaseUrl(), serverEnv.supabaseSecretKey(), {
    auth: statelessAuth,
    global: { fetch: noStoreFetch },
  });
  return serviceClient;
}

/** Publishable-key client for public aggregate reads. */
export function getPublicClient(): SupabaseClient {
  publicClient ??= createClient(serverEnv.supabaseUrl(), serverEnv.supabasePublishableKey(), {
    auth: statelessAuth,
    global: { fetch: noStoreFetch },
  });
  return publicClient;
}

/**
 * Client bound to the signed-in admin's session cookies. Admin RPCs run with the user's
 * JWT, so the database itself re-checks the admin allowlist via auth.uid().
 */
export async function getSessionClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(serverEnv.supabaseUrl(), serverEnv.supabasePublishableKey(), {
    global: { fetch: noStoreFetch },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render: cookies are refreshed by src/proxy.ts.
        }
      },
    },
  });
}
