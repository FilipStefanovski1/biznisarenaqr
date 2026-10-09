import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { LOCALES } from "@/i18n/messages";
import { getAdminContext } from "@/lib/admin-auth";
import { isSameOrigin, json, readJson } from "@/lib/http";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("open"), roundId: z.string().uuid() }),
  z.object({ action: z.literal("close"), roundId: z.string().uuid() }),
  z.object({
    action: z.literal("create"),
    label: z.string().trim().min(1).max(120),
    isRehearsal: z.boolean(),
  }),
  z.object({ action: z.literal("simulate"), roundId: z.string().uuid(), count: z.number().int().min(1).max(200) }),
  z.object({ action: z.literal("locale"), locale: z.enum(LOCALES) }),
]);

const FAILURE_STATUS: Record<string, number> = {
  round_not_found: 404,
  invalid_label: 400,
  invalid_count: 400,
  not_rehearsal: 403,
};

/** All round lifecycle mutations. Requires an allowlisted admin session. */
export async function POST(request: NextRequest) {
  await connection();
  if (!isSameOrigin(request)) return json({ ok: false, code: "forbidden_origin" }, { status: 403 });

  const admin = await getAdminContext();
  if (admin.status === "anonymous") return json({ ok: false, code: "unauthenticated" }, { status: 401 });
  if (admin.status === "forbidden") return json({ ok: false, code: "forbidden" }, { status: 403 });

  let input: z.infer<typeof actionSchema>;
  try {
    const parsed = actionSchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ ok: false, code: "invalid_request" }, { status: 400 });
    input = parsed.data;
  } catch {
    return json({ ok: false, code: "invalid_request" }, { status: 400 });
  }

  const call =
    input.action === "open"
      ? admin.client.rpc("admin_open_round", { p_round_id: input.roundId })
      : input.action === "close"
        ? admin.client.rpc("admin_close_round", { p_round_id: input.roundId })
        : input.action === "create"
          ? admin.client.rpc("admin_create_round", { p_label: input.label, p_is_rehearsal: input.isRehearsal })
          : input.action === "simulate"
            ? admin.client.rpc("admin_simulate_votes", { p_round_id: input.roundId, p_count: input.count })
            : admin.client.rpc("admin_set_screen_locale", { p_locale: input.locale });

  const { data, error } = await call;
  if (error) {
    if (error.code === "42501") return json({ ok: false, code: "forbidden" }, { status: 403 });
    console.error(`admin ${input.action} failed`, error);
    return json({ ok: false, code: "unavailable" }, { status: 503 });
  }
  const result = data as { ok: boolean; code: string };
  return json(result, { status: result.ok ? 200 : (FAILURE_STATUS[result.code] ?? 409) });
}
