import { createClient } from "@supabase/supabase-js";
import { Pool, type PoolClient } from "pg";
import { loadEnv } from "../../scripts/load-env";

loadEnv();

export const DB_URL = process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
export const SECRET_KEY = process.env.SUPABASE_SECRET_KEY!;

// Safety: these tests create rounds and votes. Never run them against a remote database.
for (const url of [DB_URL, SUPABASE_URL]) {
  const host = new URL(url).hostname;
  if (!["127.0.0.1", "localhost"].includes(host)) {
    throw new Error(`Refusing to run DB tests against non-local host ${host}`);
  }
}

export const pool = new Pool({ connectionString: DB_URL, max: 60 });

export type Json = Record<string, unknown> & { ok?: boolean; code?: string };

export const service = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });

let adminId: string | null = null;

export async function ensureUser(email: string, password: string, admin: boolean): Promise<string> {
  const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
  let id = created.data.user?.id;
  if (!id) {
    const { data } = await service.auth.admin.listUsers({ perPage: 1000 });
    id = data.users.find((u) => u.email === email)!.id;
  }
  if (admin) {
    const { error } = await service.rpc("provision_admin", { p_user_id: id, p_email: email });
    if (error) throw error;
  }
  return id!;
}

async function getAdminId() {
  adminId ??= await ensureUser("db-test-admin@biznisarena.test", "db-test-admin-password-1", true);
  return adminId;
}

/** Runs SQL with the JWT claims of the test admin (what PostgREST does for a session). */
export async function asAdmin<T = Json>(sql: string, params: unknown[] = []): Promise<T> {
  const id = await getAdminId();
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: id, role: "authenticated" }),
    ]);
    const res = await client.query(sql, params);
    await client.query("commit");
    return Object.values(res.rows[0] ?? {})[0] as T;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function query<T = Json>(sql: string, params: unknown[] = [], client?: PoolClient): Promise<T> {
  const res = await (client ?? pool).query(sql, params);
  return Object.values(res.rows[0] ?? {})[0] as T;
}

export async function activeRound(): Promise<{ id: string; status: string }> {
  const res = await pool.query(
    "select r.id, r.status from voting.event_state es join voting.rounds r on r.id = es.active_round_id",
  );
  return res.rows[0];
}

/** Closes whatever is open and creates a fresh, clearly labelled rehearsal round. */
export async function freshRehearsalRound(open = true): Promise<string> {
  const current = await activeRound();
  if (current.status === "open") await asAdmin("select public.admin_close_round($1)", [current.id]);
  const created = await asAdmin<{ state: { round: { id: string } } }>(
    "select public.admin_create_round($1, true)",
    [`TEST (db) ${new Date().toISOString()}`],
  );
  const id = created.state.round.id;
  if (open) await asAdmin("select public.admin_open_round($1)", [id]);
  return id;
}

export function vote(roundId: string, voterId: string, contestantId: string, hash: string | null = null, limit = 0) {
  return query<Json>("select public.cast_vote($1, $2, $3, $4, $5)", [roundId, voterId, contestantId, hash, limit]);
}

export async function countVotes(roundId: string): Promise<number> {
  return Number(await query("select count(*) from voting.votes where round_id = $1", [roundId]));
}
