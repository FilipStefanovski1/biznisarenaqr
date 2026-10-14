import { connection, type NextRequest } from "next/server";
import { isSameOrigin, json } from "@/lib/http";
import { parseSnapshot } from "@/lib/snapshot";
import { getPublicClient } from "@/lib/supabase/server";

/**
 * Called by the LED screen and the control room when the countdown reaches zero.
 * The database only closes the active round if its deadline has really passed, so this
 * needs no login and cannot end voting early.
 */
export async function POST(request: NextRequest) {
  await connection();
  if (!isSameOrigin(request)) return json({ ok: false, code: "forbidden_origin" }, { status: 403 });
  const { data, error } = await getPublicClient().rpc("expire_round");
  if (error || !data) {
    console.error("expire_round failed", error);
    return json({ ok: false, code: "unavailable" }, { status: 503 });
  }
  const result = data as { ok: boolean; code: string; state?: unknown };
  return json({ ...result, state: parseSnapshot(result.state) });
}
