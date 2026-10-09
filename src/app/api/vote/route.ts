import { cookies } from "next/headers";
import { connection, type NextRequest } from "next/server";
import { z } from "zod";
import { isContestantId } from "@/config/contestants";
import { serverEnv } from "@/lib/env";
import { clientIp, isSameOrigin, json, readJson } from "@/lib/http";
import { fetchPublicState } from "@/lib/public-state";
import { voterStateSchema } from "@/lib/snapshot";
import { getServiceClient } from "@/lib/supabase/server";
import {
  VOTER_COOKIE,
  VOTER_COOKIE_MAX_AGE,
  clientHash,
  createVoterToken,
  verifyVoterToken,
} from "@/lib/voter-identity";

async function setVoterCookie(token: string, request: NextRequest) {
  const store = await cookies();
  store.set(VOTER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/",
    maxAge: VOTER_COOKIE_MAX_AGE,
  });
}

/** Returns the active round + this voter's accepted vote (restores state after refresh). */
export async function GET(request: NextRequest) {
  await connection();
  const secret = serverEnv.voterCookieSecret();
  const store = await cookies();
  let voterId = verifyVoterToken(store.get(VOTER_COOKIE)?.value, secret);
  if (!voterId) {
    const created = createVoterToken(secret);
    voterId = created.voterId;
    await setVoterCookie(created.token, request);
  }

  const { data, error } = await getServiceClient().rpc("get_voter_state", { p_voter_id: voterId });
  if (error) {
    console.error("get_voter_state failed", error);
    return json({ code: "unavailable" }, { status: 503 });
  }
  const parsed = voterStateSchema.safeParse(data);
  if (!parsed.success) return json({ code: "unavailable" }, { status: 503 });
  return json(parsed.data);
}

const voteBody = z.object({
  roundId: z.string().uuid(),
  contestantId: z.string().max(40),
});

const STATUS_BY_CODE: Record<string, number> = {
  accepted: 200,
  already_voted: 200,
  invalid_request: 400,
  invalid_contestant: 400,
  round_not_found: 409,
  round_not_active: 409,
  not_open: 409,
  rate_limited: 429,
};

/** Casts one vote. Idempotent: retries return the already-accepted vote. */
export async function POST(request: NextRequest) {
  await connection();
  if (!isSameOrigin(request)) return json({ ok: false, code: "forbidden_origin" }, { status: 403 });

  let body: z.infer<typeof voteBody>;
  try {
    const parsed = voteBody.safeParse(await readJson(request));
    if (!parsed.success) return json({ ok: false, code: "invalid_request" }, { status: 400 });
    body = parsed.data;
  } catch {
    return json({ ok: false, code: "invalid_request" }, { status: 400 });
  }
  if (!isContestantId(body.contestantId)) {
    return json({ ok: false, code: "invalid_contestant" }, { status: 400 });
  }

  const secret = serverEnv.voterCookieSecret();
  const voterId = verifyVoterToken((await cookies()).get(VOTER_COOKIE)?.value, secret);
  if (!voterId) return json({ ok: false, code: "no_identity" }, { status: 401 });

  const { data, error } = await getServiceClient().rpc("cast_vote", {
    p_round_id: body.roundId,
    p_voter_id: voterId,
    p_contestant_id: body.contestantId,
    p_client_hash: clientHash(clientIp(request), secret),
    p_rate_limit_per_minute: serverEnv.voteRateLimitPerMinute(),
  });
  if (error || !data || typeof data !== "object") {
    console.error("cast_vote failed", error);
    return json({ ok: false, code: "unavailable" }, { status: 503 });
  }

  const result = data as { ok: boolean; code: string; roundId?: string; contestantId?: string };
  const status = STATUS_BY_CODE[result.code] ?? (result.ok ? 200 : 409);
  if (result.ok) return json(result, { status });

  // Rejections include the current state so the phone can re-render (e.g. voting closed).
  const state = await fetchPublicState().catch(() => null);
  return json({ ...result, state }, { status });
}
