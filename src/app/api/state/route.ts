import { connection, type NextRequest } from "next/server";
import { json } from "@/lib/http";
import { fetchPublicState } from "@/lib/public-state";

/**
 * Public aggregate snapshot of the active round.
 * - Default: briefly CDN-cacheable (1 s) so hundreds of phones polling for status
 *   changes collapse into a handful of database reads.
 * - ?fresh=1: never cached; used by /screen and /admin to reconcile authoritative state.
 */
export async function GET(request: NextRequest) {
  await connection();
  const fresh = request.nextUrl.searchParams.has("fresh");
  try {
    const state = await fetchPublicState();
    return json(state, {
      headers: fresh
        ? { "Cache-Control": "no-store, max-age=0" }
        : { "Cache-Control": "public, max-age=0, s-maxage=1, stale-while-revalidate=2" },
    });
  } catch (error) {
    console.error(error);
    return json({ code: "unavailable" }, { status: 503 });
  }
}
