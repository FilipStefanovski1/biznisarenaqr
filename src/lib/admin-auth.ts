import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSessionClient } from "@/lib/supabase/server";

export type AdminContext =
  | { status: "anonymous" }
  | { status: "forbidden"; user: User }
  | { status: "admin"; user: User; client: SupabaseClient };

/**
 * Server-side admin check used by the /admin page and every /api/admin route.
 * 1. getUser() validates the session JWT with Supabase Auth (not just decoding a cookie).
 * 2. am_i_admin() checks the database allowlist for that user id.
 * The admin RPCs repeat check 2 inside the database, so the API layer is not the only gate.
 */
export async function getAdminContext(): Promise<AdminContext> {
  const client = await getSessionClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { status: "anonymous" };
  const { data: isAdmin, error: rpcError } = await client.rpc("am_i_admin");
  if (rpcError || isAdmin !== true) return { status: "forbidden", user: data.user };
  return { status: "admin", user: data.user, client };
}
