import { connection, type NextRequest } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { resultsToCsv } from "@/lib/csv";
import { json } from "@/lib/http";
import { parseSnapshot } from "@/lib/snapshot";

/** CSV of the final aggregate results of a closed round. */
export async function GET(request: NextRequest) {
  await connection();
  const admin = await getAdminContext();
  if (admin.status === "anonymous") return json({ code: "unauthenticated" }, { status: 401 });
  if (admin.status === "forbidden") return json({ code: "forbidden" }, { status: 403 });

  const roundId = request.nextUrl.searchParams.get("roundId") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(roundId)) return json({ code: "invalid_request" }, { status: 400 });

  const { data, error } = await admin.client.rpc("admin_get_round", { p_round_id: roundId });
  if (error) return json({ code: "unavailable" }, { status: 503 });
  const snapshot = parseSnapshot(data);
  if (!snapshot?.round) return json({ code: "round_not_found" }, { status: 404 });
  if (snapshot.round.status !== "closed") return json({ code: "round_not_closed" }, { status: 409 });

  const stamp = (snapshot.round.closedAt ?? "").slice(0, 10);
  const kind = snapshot.round.isRehearsal ? "proba" : "rezultati";
  return new Response(resultsToCsv(snapshot), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="biznis-arena-${kind}-${stamp}-${roundId.slice(0, 8)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
