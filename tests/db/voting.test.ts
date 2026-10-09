import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { activeRound, asAdmin, countVotes, freshRehearsalRound, pool, query, vote, type Json } from "./helpers";

afterAll(async () => {
  await pool.end();
});

describe("vote integrity (database)", () => {
  it("accepts exactly one vote per voter even with concurrent duplicate submissions", async () => {
    const round = await freshRehearsalRound();
    const voter = randomUUID();
    const results = await Promise.all(Array.from({ length: 25 }, () => vote(round, voter, "yova")));
    expect(results.filter((r) => r.code === "accepted")).toHaveLength(1);
    expect(results.filter((r) => r.code === "already_voted")).toHaveLength(24);
    expect(results.every((r) => r.ok && r.contestantId === "yova")).toBe(true);
    expect(await countVotes(round)).toBe(1);
  });

  it("is idempotent: a retry (even with another choice) returns the original accepted vote", async () => {
    const round = await freshRehearsalRound();
    const voter = randomUUID();
    expect((await vote(round, voter, "seed-of-life")).code).toBe("accepted");
    const retry = await vote(round, voter, "yova");
    expect(retry).toMatchObject({ ok: true, code: "already_voted", contestantId: "seed-of-life" });
    expect(await countVotes(round)).toBe(1);
  });

  it("rejects invalid contestants and unknown/inactive rounds", async () => {
    const round = await freshRehearsalRound();
    expect((await vote(round, randomUUID(), "not-a-contestant")).code).toBe("invalid_contestant");
    expect((await vote(randomUUID(), randomUUID(), "yova")).code).toBe("round_not_found");
    expect(await countVotes(round)).toBe(0);
  });

  it("rejects votes while waiting and after closing, but still returns an accepted vote on retry", async () => {
    const round = await freshRehearsalRound(false);
    expect(await vote(round, randomUUID(), "yova")).toMatchObject({ ok: false, code: "not_open" });
    await asAdmin("select public.admin_open_round($1)", [round]);
    const voter = randomUUID();
    expect((await vote(round, voter, "yova")).code).toBe("accepted");
    await asAdmin("select public.admin_close_round($1)", [round]);
    expect(await vote(round, randomUUID(), "yova")).toMatchObject({ ok: false, code: "not_open" });
    expect(await vote(round, voter, "yova")).toMatchObject({ ok: true, code: "already_voted" });
    expect(await countVotes(round)).toBe(1);
  });

  it("closing races with votes consistently: every accepted vote is in the final totals, none after", async () => {
    const round = await freshRehearsalRound();
    const contestants = ["yova", "bubu-kosmetik", "seed-of-life"];
    const voters = Array.from({ length: 300 }, () => randomUUID());
    const votes = voters.map((v, i) => vote(round, v, contestants[i % 3]!).then((r) => ({ v, r })));
    // Close while the burst is in flight.
    const close = new Promise<Json>((resolve, reject) =>
      setTimeout(() => asAdmin<Json>("select public.admin_close_round($1)", [round]).then(resolve, reject), 15),
    );
    const [results, closed] = await Promise.all([Promise.all(votes), close]);

    const accepted = results.filter((x) => x.r.code === "accepted");
    const rejected = results.filter((x) => x.r.code === "not_open");
    expect(accepted.length + rejected.length).toBe(300);
    console.log(`[measure] db close race: ${accepted.length} accepted before close, ${rejected.length} rejected after`);
    expect(closed.code).toBe("closed");

    const finalState = closed.state as { total: number; results: { contestantId: string; votes: number }[] };
    expect(finalState.total).toBe(accepted.length);
    expect(await countVotes(round)).toBe(accepted.length);

    const stored = new Set(
      (await pool.query("select voter_id from voting.votes where round_id = $1", [round])).rows.map((r) => r.voter_id),
    );
    for (const a of accepted) expect(stored.has(a.v)).toBe(true);
    for (const r of rejected) expect(stored.has(r.v)).toBe(false);

    const lateVotes = await query<string>(
      "select count(*) from voting.votes v join voting.rounds r on r.id = v.round_id where r.id = $1 and v.created_at > r.closed_at",
      [round],
    );
    expect(Number(lateVotes)).toBe(0);

    // The authoritative public snapshot equals the closing snapshot.
    const pub = await query<{ total: number; results: unknown }>("select public.get_public_state()");
    expect(pub.total).toBe(finalState.total);
    expect(pub.results).toEqual(finalState.results);
  });

  it("increments a global version on every change", async () => {
    const round = await freshRehearsalRound();
    const v0 = (await query<{ version: number }>("select public.get_public_state()")).version;
    await vote(round, randomUUID(), "yova");
    const v1 = (await query<{ version: number }>("select public.get_public_state()")).version;
    await vote(round, randomUUID(), "yova");
    const v2 = (await query<{ version: number }>("select public.get_public_state()")).version;
    expect(v1).toBeGreaterThan(v0);
    expect(v2).toBeGreaterThan(v1);
  });

  it("a new round preserves previous results and lets the same voter vote again", async () => {
    const first = await freshRehearsalRound();
    const voter = randomUUID();
    await vote(first, voter, "yova");
    await vote(first, randomUUID(), "bubu-kosmetik");
    await asAdmin("select public.admin_close_round($1)", [first]);
    const before = await query("select public.admin_get_round($1)", [first]).catch(() => null);
    expect(before).toBeNull(); // admin functions refuse callers without admin claims

    const second = await freshRehearsalRound();
    expect(second).not.toBe(first);
    expect((await vote(second, voter, "seed-of-life")).code).toBe("accepted");
    expect(await countVotes(first)).toBe(2);
    expect(await countVotes(second)).toBe(1);
    const old = await asAdmin<{ round: { status: string }; total: number }>("select public.admin_get_round($1)", [first]);
    expect(old).toMatchObject({ round: { status: "closed" }, total: 2 });
    // Old round id is no longer accepted.
    expect((await vote(first, randomUUID(), "yova")).code).toBe("round_not_active");
  });

  it("refuses to create a new round while one is open", async () => {
    const round = await freshRehearsalRound();
    const res = await asAdmin<Json>("select public.admin_create_round('x', true)");
    expect(res.code).toBe("active_round_open");
    expect((await activeRound()).id).toBe(round);
  });

  it("closed rounds and recorded votes are immutable at the database level", async () => {
    const round = await freshRehearsalRound();
    await vote(round, randomUUID(), "yova");
    await asAdmin("select public.admin_close_round($1)", [round]);
    await expect(pool.query("update voting.rounds set label = 'x', version = version + 1 where id = $1", [round])).rejects.toThrow(/immutable/);
    await expect(pool.query("update voting.rounds set status = 'open', version = version + 1 where id = $1", [round])).rejects.toThrow();
    await expect(pool.query("delete from voting.votes where round_id = $1", [round])).rejects.toThrow(/append-only/);
    await expect(
      pool.query("insert into voting.votes (round_id, voter_id, contestant_id) values ($1, gen_random_uuid(), 'yova')", [round]),
    ).rejects.toThrow(/only be recorded while the round is open/);
    await expect(pool.query("delete from voting.rounds where id = $1", [round])).rejects.toThrow();
  });

  it("simulated votes are refused on production rounds", async () => {
    const prodId = await query<string>("select id from voting.rounds where not is_rehearsal order by created_at limit 1");
    expect(prodId).toBeTruthy();
    const before = await countVotes(prodId);
    const res = await asAdmin<Json>("select public.admin_simulate_votes($1, 10)", [prodId]);
    expect(res.code).toBe("not_rehearsal");
    expect(await countVotes(prodId)).toBe(before);
  });

  it("applies the generous per-network rate limit only to new votes", async () => {
    const round = await freshRehearsalRound();
    const hash = `test-${randomUUID()}`;
    const voter = randomUUID();
    expect((await vote(round, voter, "yova", hash, 2)).code).toBe("accepted");
    expect((await vote(round, randomUUID(), "yova", hash, 2)).code).toBe("accepted");
    expect((await vote(round, randomUUID(), "yova", hash, 2)).code).toBe("rate_limited");
    // Retries of an accepted vote are never limited.
    expect((await vote(round, voter, "yova", hash, 2)).code).toBe("already_voted");
    expect(await countVotes(round)).toBe(2);
  });

  it("screen language is admin-only, validated, and versioned even while a round is closed", async () => {
    const round = await freshRehearsalRound();
    await asAdmin("select public.admin_close_round($1)", [round]);
    const before = (await query<{ version: number }>("select public.get_public_state()")).version;
    expect((await asAdmin<Json>("select public.admin_set_screen_locale('xx')")).code).toBe("invalid_locale");
    const res = await asAdmin<{ ok: boolean; state: { version: number; screenLocale: string } }>(
      "select public.admin_set_screen_locale('sv')",
    );
    expect(res.ok).toBe(true);
    expect(res.state.screenLocale).toBe("sv");
    expect(res.state.version).toBeGreaterThan(before);
    await expect(query("select public.admin_set_screen_locale('en')")).rejects.toThrow(/admin privileges required/);
    await asAdmin("select public.admin_set_screen_locale('mk')");
  });

  it("deletes rehearsal rounds (and their votes) but never production rounds", async () => {
    const prodId = await query<string>("select id from voting.rounds where not is_rehearsal order by created_at limit 1");
    expect((await asAdmin<Json>("select public.admin_delete_rehearsal_round($1)", [prodId])).code).toBe("not_rehearsal");

    const rehearsal = await freshRehearsalRound();
    await vote(rehearsal, randomUUID(), "yova");
    expect((await asAdmin<Json>("select public.admin_delete_rehearsal_round($1)", [rehearsal])).code).toBe("round_open");
    await asAdmin("select public.admin_close_round($1)", [rehearsal]);
    const before = (await query<{ version: number }>("select public.get_public_state()")).version;

    const res = await asAdmin<{ ok: boolean; deletedVotes: number; state: { version: number; round: { id: string } } }>(
      "select public.admin_delete_rehearsal_round($1)",
      [rehearsal],
    );
    expect(res.ok).toBe(true);
    expect(res.deletedVotes).toBe(1);
    expect(res.state.round.id).not.toBe(rehearsal); // public URLs moved to another round
    expect(res.state.version).toBeGreaterThan(before);
    expect(Number(await query("select count(*) from voting.rounds where id = $1", [rehearsal]))).toBe(0);
    expect(await countVotes(rehearsal)).toBe(0);

    // Outside the admin function the protections still hold, even for rehearsal rounds.
    const other = await freshRehearsalRound();
    await vote(other, randomUUID(), "yova");
    await expect(pool.query("delete from voting.votes where round_id = $1", [other])).rejects.toThrow(/append-only/);
    await expect(query("select public.admin_delete_rehearsal_round($1)", [other])).rejects.toThrow(/admin privileges required/);
  });
});
