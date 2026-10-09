/**
 * Isolated load test: ~500 simulated guests + a burst of 100 simultaneous submissions,
 * going through the real HTTP API (identity cookie → POST /api/vote) exactly like phones.
 *
 * SAFETY: it only ever votes in a REHEARSAL round. It aborts unless the active round is
 * flagged isRehearsal and open, and every request carries that round id, so even if an
 * admin switches rounds mid-test no vote can land in a production round.
 *
 *   npm run loadtest -- --create-round        # local: creates + opens a rehearsal round
 *   LOADTEST_BASE_URL=https://staging.example npm run loadtest   # existing rehearsal round
 *
 * Env: LOADTEST_BASE_URL (default http://localhost:3100), LOADTEST_GUESTS (500),
 *      LOADTEST_BURST (100), LOADTEST_CONCURRENCY (50), LOADTEST_ALLOW_REMOTE=1 for a
 *      non-local target, E2E_ADMIN_EMAIL/E2E_ADMIN_PASSWORD for --create-round.
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env";

loadEnv();

const BASE = (process.env.LOADTEST_BASE_URL ?? "http://localhost:3100").replace(/\/$/, "");
const GUESTS = Number(process.env.LOADTEST_GUESTS ?? 500);
const BURST = Number(process.env.LOADTEST_BURST ?? 100);
const CONCURRENCY = Number(process.env.LOADTEST_CONCURRENCY ?? 50);
const CONTESTANTS = ["yova", "bubu-kosmetik", "seed-of-life"] as const;

type Snapshot = {
  version: number;
  round: { id: string; status: string; isRehearsal: boolean; label: string } | null;
  results: { contestantId: string; votes: number }[];
  total: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function stats(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const pick = (p: number) => s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0;
  const r = (n: number) => Math.round(n);
  return { n: s.length, p50: r(pick(50)), p95: r(pick(95)), p99: r(pick(99)), max: r(s[s.length - 1] ?? 0) };
}

async function getState(): Promise<Snapshot> {
  const res = await fetch(`${BASE}/api/state?fresh=1`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/state → ${res.status}`);
  return (await res.json()) as Snapshot;
}

class Guest {
  cookie = "";
  async identify() {
    const res = await fetch(`${BASE}/api/vote`, { cache: "no-store" });
    const set = res.headers.getSetCookie().find((c) => c.startsWith("ba_voter="));
    if (!set) throw new Error(`no identity cookie (status ${res.status})`);
    this.cookie = set.split(";")[0]!;
    await res.arrayBuffer();
  }
  async vote(roundId: string, contestantId: string) {
    const started = performance.now();
    const res = await fetch(`${BASE}/api/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE, Cookie: this.cookie },
      body: JSON.stringify({ roundId, contestantId }),
    });
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    return { status: res.status, code: body.code ?? "?", ms: performance.now() - started };
  }
}

async function pool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) await fn(items[i++]!);
    }),
  );
}

async function createRehearsalRound() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("--create-round needs E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const current = await getState();
  if (current.round?.status === "open") {
    if (!current.round.isRehearsal) throw new Error("A PRODUCTION round is open. Refusing to touch it.");
    await supabase.rpc("admin_close_round", { p_round_id: current.round.id });
  }
  const created = await supabase.rpc("admin_create_round", { p_label: `LOAD TEST ${new Date().toISOString()}`, p_is_rehearsal: true });
  if (created.error || !created.data?.ok) throw new Error(`create failed: ${JSON.stringify(created.error ?? created.data)}`);
  const id = created.data.state.round.id as string;
  const opened = await supabase.rpc("admin_open_round", { p_round_id: id });
  if (opened.error || !opened.data?.ok) throw new Error(`open failed: ${JSON.stringify(opened.error ?? opened.data)}`);
  console.log(`Created and opened rehearsal round ${id}`);
}

async function main() {
  const host = new URL(BASE).hostname;
  if (!["localhost", "127.0.0.1"].includes(host) && process.env.LOADTEST_ALLOW_REMOTE !== "1") {
    throw new Error(`Target ${BASE} is not local. Set LOADTEST_ALLOW_REMOTE=1 to load-test a staging deployment.`);
  }
  if (process.argv.includes("--create-round")) await createRehearsalRound();

  const before = await getState();
  if (!before.round || !before.round.isRehearsal || before.round.status !== "open") {
    throw new Error(
      `Active round must be an OPEN REHEARSAL round (got ${before.round ? `${before.round.isRehearsal ? "rehearsal" : "PRODUCTION"} / ${before.round.status}` : "none"}). Aborting.`,
    );
  }
  const roundId = before.round.id;
  console.log(`Target ${BASE}, rehearsal round "${before.round.label}" (${roundId}), starting total ${before.total}`);

  // Realtime observer: what the LED screen would receive.
  const rt = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
  const messages: { at: number; total: number; version: number }[] = [];
  await new Promise<void>((resolve, reject) => {
    rt.channel("scoreboard", { config: { private: true } })
      .on("broadcast", { event: "snapshot" }, ({ payload }) => {
        const p = payload as Snapshot;
        if (p.round?.id === roundId) messages.push({ at: performance.now(), total: p.total, version: p.version });
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") reject(new Error(`realtime ${status}`));
      });
  });

  const expected: Record<string, number> = Object.fromEntries(CONTESTANTS.map((c) => [c, 0]));
  const codes: Record<string, number> = {};
  const record = (r: { status: number; code: string }, contestant: string) => {
    codes[`${r.status} ${r.code}`] = (codes[`${r.status} ${r.code}`] ?? 0) + 1;
    if (r.code === "accepted") expected[contestant]!++;
  };

  // Phase 1: steady arrival of GUESTS phones (identity + vote), CONCURRENCY at a time.
  const guests = Array.from({ length: GUESTS }, () => new Guest());
  const steadyLatency: number[] = [];
  const t1 = performance.now();
  await pool(
    guests.map((g, i) => ({ g, c: CONTESTANTS[i % 3]! })),
    CONCURRENCY,
    async ({ g, c }) => {
      await g.identify();
      const r = await g.vote(roundId, c);
      steadyLatency.push(r.ms);
      record(r, c);
    },
  );
  const steadySeconds = (performance.now() - t1) / 1000;

  // Phase 2: BURST brand-new phones submit at the same instant.
  const burstGuests = Array.from({ length: BURST }, () => new Guest());
  await pool(burstGuests, CONCURRENCY, (g) => g.identify());
  const burstLatency: number[] = [];
  const burstStart = performance.now();
  await Promise.all(
    burstGuests.map(async (g, i) => {
      const c = CONTESTANTS[(i * 7) % 3]!;
      const r = await g.vote(roundId, c);
      burstLatency.push(r.ms);
      record(r, c);
    }),
  );
  const burstEnd = performance.now();

  // Phase 3: retries of already-accepted votes must not add anything.
  const retryCodes: Record<string, number> = {};
  await Promise.all(
    guests.slice(0, 50).map(async (g) => {
      const r = await g.vote(roundId, "yova");
      retryCodes[r.code] = (retryCodes[r.code] ?? 0) + 1;
    }),
  );

  const accepted = Object.values(expected).reduce((a, b) => a + b, 0);
  const targetTotal = before.total + accepted;
  const deadline = performance.now() + 5000;
  while (!messages.some((m) => m.total === targetTotal) && performance.now() < deadline) await sleep(20);
  const finalMsg = messages.find((m) => m.total === targetTotal);
  const after = await getState();
  await rt.removeAllChannels();

  const perContestantOk = CONTESTANTS.every((c) => {
    const startVotes = before.results.find((r) => r.contestantId === c)?.votes ?? 0;
    const endVotes = after.results.find((r) => r.contestantId === c)?.votes ?? 0;
    return endVotes - startVotes === expected[c];
  });

  const report = {
    target: BASE,
    roundId,
    guests: GUESTS,
    burst: BURST,
    concurrency: CONCURRENCY,
    responseCodes: codes,
    retryOfAcceptedVotes: retryCodes,
    steady: { seconds: +steadySeconds.toFixed(2), votesPerSecond: +(GUESTS / steadySeconds).toFixed(1), latencyMs: stats(steadyLatency) },
    burstResult: { wallMs: Math.round(burstEnd - burstStart), latencyMs: stats(burstLatency) },
    realtime: {
      snapshotsReceived: messages.length,
      // <= 0 means the final snapshot arrived before the slowest HTTP response finished.
      lastBurstResponseToFinalSnapshotMs: finalMsg ? Math.round(finalMsg.at - burstEnd) : null,
      burstStartToFinalSnapshotMs: finalMsg ? Math.round(finalMsg.at - burstStart) : null,
      versionsMonotonicInArrivalOrder: messages.every((m, i) => i === 0 || m.version > messages[i - 1]!.version),
    },
    totals: { before: before.total, acceptedNow: accepted, after: after.total, consistent: after.total === targetTotal && perContestantOk },
  };
  console.log(JSON.stringify(report, null, 2));
  if (!report.totals.consistent || (retryCodes.accepted ?? 0) > 0) {
    console.error("✗ Totals inconsistent or retries were double counted");
    process.exit(1);
  }
  console.log("✓ Final totals match accepted submissions exactly; retries were not double counted.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
