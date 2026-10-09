import { connection } from "next/server";
import { getAdminContext } from "@/lib/admin-auth";
import { json } from "@/lib/http";

/** Round history (aggregates only) for the admin console. */
export async function GET() {
  await connection();
  const admin = await getAdminContext();
  if (admin.status === "anonymous") return json({ code: "unauthenticated" }, { status: 401 });
  if (admin.status === "forbidden") return json({ code: "forbidden" }, { status: 403 });
  const { data, error } = await admin.client.rpc("admin_list_rounds");
  if (error) return json({ code: "unavailable" }, { status: 503 });
  return json({ rounds: data });
}
