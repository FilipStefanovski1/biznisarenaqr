import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";
import { PUBLISHABLE_KEY, SUPABASE_URL, ensureUser, freshRehearsalRound, pool, vote } from "./helpers";

const anon = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false } });

afterAll(async () => {
  await anon.removeAllChannels();
  await pool.end();
});

async function signedInNonAdmin(): Promise<SupabaseClient> {
  const email = "not-an-admin@biznisarena.test";
  const password = "not-an-admin-password-1";
  await ensureUser(email, password, false);
  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

describe("public API surface (PostgREST with the publishable key)", () => {
  it("anon can read only the aggregate public state", async () => {
    const { data, error } = await anon.rpc("get_public_state");
    expect(error).toBeNull();
    expect(Object.keys(data).sort()).toEqual(["results", "round", "screenLocale", "total", "version"]);
    expect(JSON.stringify(data)).not.toMatch(/voter/i);
  });

  it("anon cannot cast votes, read voter state or call admin functions directly", async () => {
    const round = await freshRehearsalRound();
    for (const [fn, args] of [
      ["cast_vote", { p_round_id: round, p_voter_id: randomUUID(), p_contestant_id: "yova" }],
      ["get_voter_state", { p_voter_id: randomUUID() }],
      ["admin_close_round", { p_round_id: round }],
      ["admin_create_round", { p_label: "x", p_is_rehearsal: true }],
      ["admin_simulate_votes", { p_round_id: round, p_count: 5 }],
      ["provision_admin", { p_user_id: randomUUID(), p_email: "x@y.z" }],
    ] as const) {
      const { error } = await anon.rpc(fn, args);
      expect(error, fn).not.toBeNull();
    }
    const { rows } = await pool.query("select count(*)::int as n from voting.votes where round_id = $1", [round]);
    expect(rows[0].n).toBe(0);
  });

  it("public sign-up is disabled, so nobody can self-register an account", async () => {
    const { data, error } = await anon.auth.signUp({ email: `intruder-${randomUUID()}@example.com`, password: "intruder-password-1" });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });

  it("raw tables are not reachable through the Data API", async () => {
    const votes = await anon.schema("voting" as "public").from("votes").select("*");
    expect(votes.error).not.toBeNull();
    const pub = await anon.from("votes").select("*");
    expect(pub.error).not.toBeNull();
  });

  it("a signed-in user who is not on the allowlist is refused by the database", async () => {
    const round = await freshRehearsalRound();
    const user = await signedInNonAdmin();
    expect((await user.rpc("am_i_admin")).data).toBe(false);
    const close = await user.rpc("admin_close_round", { p_round_id: round });
    expect(close.error?.code).toBe("42501");
    const create = await user.rpc("admin_create_round", { p_label: "x", p_is_rehearsal: true });
    expect(create.error?.code).toBe("42501");
    const { rows } = await pool.query("select status from voting.rounds where id = $1", [round]);
    expect(rows[0].status).toBe("open");
  });
});

describe("realtime scoreboard channel", () => {
  it("delivers committed snapshots to anon subscribers and rejects client-sent spoofs", async () => {
    const round = await freshRehearsalRound();
    const listener = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const spoofer = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false } });
    const received: { version: number; total: number; round: { id: string } }[] = [];

    const subscribe = (client: SupabaseClient, onMsg?: (p: never) => void) =>
      new Promise<ReturnType<SupabaseClient["channel"]>>((resolve, reject) => {
        const ch = client.channel("scoreboard", { config: { private: true } });
        if (onMsg) ch.on("broadcast", { event: "snapshot" }, ({ payload }) => onMsg(payload as never));
        ch.subscribe((status, err) => {
          if (status === "SUBSCRIBED") resolve(ch);
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(err ?? new Error(status));
        });
      });

    await subscribe(listener, (p) => received.push(p));
    const spoofChannel = await subscribe(spoofer);

    const sendResult = await spoofChannel.send({
      type: "broadcast",
      event: "snapshot",
      payload: { version: 999999999, round: { id: round }, results: [], total: 0 },
    });
    await new Promise((r) => setTimeout(r, 1500));
    expect(received.some((p) => p.version === 999999999)).toBe(false);

    const started = Date.now();
    await vote(round, randomUUID(), "yova");
    while (!received.some((p) => p.round?.id === round && p.total === 1) && Date.now() - started < 5000) {
      await new Promise((r) => setTimeout(r, 25));
    }
    const latency = Date.now() - started;
    expect(received.some((p) => p.round?.id === round && p.total === 1)).toBe(true);
    console.log(`realtime delivery after commit: ${latency} ms; spoof send result: ${sendResult}`);

    await listener.removeAllChannels();
    await spoofer.removeAllChannels();
  });
});
