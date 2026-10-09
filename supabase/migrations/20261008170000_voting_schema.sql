-- Biznis Arena live audience voting: schema, integrity rules and RPC surface.
--
-- Design summary
--   * All tables live in the private `voting` schema, which is NOT exposed through
--     the Supabase Data API. Browsers can never read or write them directly.
--   * The only entry points are SECURITY DEFINER functions in `public` with explicit
--     EXECUTE grants:
--       - get_public_state()          anon/authenticated: safe aggregate snapshot only
--       - get_voter_state(), cast_vote() service_role only (called by the Next.js
--                                       server after verifying the signed voter cookie)
--       - admin_*()                     authenticated, and each one re-checks the
--                                       admin allowlist against auth.uid()
--   * Vote submission and round transitions lock the round row (SELECT ... FOR UPDATE).
--     A vote racing with closure therefore either commits first and is counted in the
--     final totals, or waits, sees status = 'closed' and is rejected.
--   * Totals are always computed from the votes table (no denormalised counters), so
--     counts cannot drift from recorded votes.
--   * Every state change takes a value from a global sequence (`version`). Realtime
--     snapshots carry it so clients can discard stale/out-of-order messages, including
--     across rounds.

create schema if not exists voting;
revoke all on schema voting from public, anon, authenticated;

create type voting.round_status as enum ('waiting', 'open', 'closed');

create sequence voting.state_version_seq as bigint;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table voting.contestants (
  id            text primary key check (id ~ '^[a-z0-9-]{1,40}$'),
  name          text not null check (char_length(name) between 1 and 80),
  display_order smallint not null unique
);

create table voting.rounds (
  id           uuid primary key default gen_random_uuid(),
  label        text not null check (char_length(btrim(label)) between 1 and 120),
  is_rehearsal boolean not null default false,
  status       voting.round_status not null default 'waiting',
  version      bigint not null default nextval('voting.state_version_seq'),
  created_at   timestamptz not null default now(),
  opened_at    timestamptz,
  closed_at    timestamptz,
  created_by   uuid,
  constraint rounds_lifecycle_timestamps check (
    (status = 'waiting' and opened_at is null and closed_at is null)
    or (status = 'open' and opened_at is not null and closed_at is null)
    or (status = 'closed' and opened_at is not null and closed_at is not null)
  )
);

create index rounds_created_at_idx on voting.rounds (created_at desc);

-- Singleton row that points at the round the public /vote and /screen URLs resolve to.
create table voting.event_state (
  id              boolean primary key default true check (id),
  active_round_id uuid not null references voting.rounds (id),
  updated_at      timestamptz not null default now()
);

create table voting.votes (
  id            bigint generated always as identity primary key,
  round_id      uuid not null references voting.rounds (id) on delete restrict,
  voter_id      uuid not null,
  contestant_id text not null references voting.contestants (id),
  client_hash   text check (client_hash is null or char_length(client_hash) <= 128),
  created_at    timestamptz not null default now(),
  -- The core integrity guarantee: one accepted vote per voter identity per round.
  constraint votes_one_per_voter_per_round unique (round_id, voter_id)
);

create index votes_round_contestant_idx on voting.votes (round_id, contestant_id);

-- Admin allowlist. Being signed in to Supabase Auth is not enough; the user id must
-- be listed here. Rows are only ever inserted with the service role (see README).
create table voting.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- Generous fixed-window abuse limiter keyed by an HMAC of the client IP.
create table voting.rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);

create table voting.admin_audit_log (
  id         bigint generated always as identity primary key,
  admin_id   uuid,
  action     text not null,
  round_id   uuid,
  details    jsonb,
  created_at timestamptz not null default now()
);

-- RLS on everything as defence in depth. No policies are defined, so the anon and
-- authenticated roles get nothing even if a grant is added by mistake later.
alter table voting.contestants     enable row level security;
alter table voting.rounds          enable row level security;
alter table voting.event_state     enable row level security;
alter table voting.votes           enable row level security;
alter table voting.admin_users     enable row level security;
alter table voting.rate_limits     enable row level security;
alter table voting.admin_audit_log enable row level security;

revoke all on all tables in schema voting from public, anon, authenticated;
revoke all on all sequences in schema voting from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

create function voting.guard_round_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'rounds cannot be deleted' using errcode = 'P0001';
  end if;
  if old.status = 'closed' then
    raise exception 'closed rounds are immutable' using errcode = 'P0001';
  end if;
  if new.id <> old.id or new.is_rehearsal <> old.is_rehearsal or new.created_at <> old.created_at then
    raise exception 'round identity fields are immutable' using errcode = 'P0001';
  end if;
  if new.status <> old.status and not (
    (old.status = 'waiting' and new.status = 'open')
    or (old.status = 'open' and new.status = 'closed')
  ) then
    raise exception 'invalid round transition % -> %', old.status, new.status using errcode = 'P0001';
  end if;
  if new.version <= old.version then
    raise exception 'round version must increase' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger rounds_guard_update
  before update or delete on voting.rounds
  for each row execute function voting.guard_round_update();

create function voting.guard_vote_insert() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_status voting.round_status;
begin
  select r.status into v_status from voting.rounds r where r.id = new.round_id;
  if v_status is distinct from 'open' then
    raise exception 'votes can only be recorded while the round is open' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger votes_guard_insert
  before insert on voting.votes
  for each row execute function voting.guard_vote_insert();

create function voting.reject_vote_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'recorded votes are append-only' using errcode = 'P0001';
end;
$$;

create trigger votes_append_only
  before update or delete on voting.votes
  for each row execute function voting.reject_vote_mutation();

-- ---------------------------------------------------------------------------
-- Internal helpers (not exposed; no grants)
-- ---------------------------------------------------------------------------

create function voting.round_snapshot(p_round_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', r.version,
    'round', jsonb_build_object(
      'id', r.id,
      'label', r.label,
      'isRehearsal', r.is_rehearsal,
      'status', r.status,
      'createdAt', r.created_at,
      'openedAt', r.opened_at,
      'closedAt', r.closed_at
    ),
    'results', (
      select coalesce(jsonb_agg(jsonb_build_object('contestantId', c.id, 'votes', coalesce(t.n, 0))
                                order by c.display_order), '[]'::jsonb)
      from voting.contestants c
      left join (
        select v.contestant_id, count(*)::int as n
        from voting.votes v
        where v.round_id = r.id
        group by v.contestant_id
      ) t on t.contestant_id = c.id
    ),
    'total', (select count(*)::int from voting.votes v where v.round_id = r.id)
  )
  from voting.rounds r
  where r.id = p_round_id;
$$;

create function voting.active_snapshot() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(
    (select voting.round_snapshot(es.active_round_id) from voting.event_state es where es.id),
    jsonb_build_object('version', 0, 'round', null, 'results', '[]'::jsonb, 'total', 0)
  );
$$;

-- Emits the snapshot on the private Realtime topic `scoreboard`. realtime.send writes
-- to realtime.messages inside the current transaction, so a message is only delivered
-- if the vote/transition commits.
create function voting.broadcast(p_snapshot jsonb) returns void
language plpgsql set search_path = '' as $$
begin
  if to_regprocedure('realtime.send(jsonb,text,text,boolean)') is not null then
    perform realtime.send(p_snapshot, 'snapshot', 'scoreboard', true);
  end if;
end;
$$;

create function voting.is_admin(p_user_id uuid) returns boolean
language sql stable set search_path = '' as $$
  select p_user_id is not null
     and exists (select 1 from voting.admin_users a where a.user_id = p_user_id);
$$;

create function voting.require_admin() returns uuid
language plpgsql stable set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
begin
  if not voting.is_admin(v_uid) then
    raise exception 'admin privileges required' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

revoke all on all functions in schema voting from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public read API
-- ---------------------------------------------------------------------------

-- Safe aggregate snapshot of the active round: metadata + per-contestant counts.
create function public.get_public_state() returns jsonb
language sql stable security definer set search_path = '' as $$
  select voting.active_snapshot();
$$;

-- ---------------------------------------------------------------------------
-- Voter API (service_role only; voter id comes from a server-verified cookie)
-- ---------------------------------------------------------------------------

create function public.get_voter_state(p_voter_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'state', voting.active_snapshot(),
    'myVote', (
      select jsonb_build_object('roundId', v.round_id, 'contestantId', v.contestant_id, 'createdAt', v.created_at)
      from voting.event_state es
      join voting.votes v on v.round_id = es.active_round_id and v.voter_id = p_voter_id
      where es.id
    )
  );
$$;

create function public.cast_vote(
  p_round_id uuid,
  p_voter_id uuid,
  p_contestant_id text,
  p_client_hash text default null,
  p_rate_limit_per_minute integer default 0
) returns jsonb
language plpgsql volatile security definer
set search_path = ''
set lock_timeout = '5s'
as $$
declare
  v_round     voting.rounds%rowtype;
  v_active    uuid;
  v_existing  text;
  v_hits      integer;
  v_snapshot  jsonb;
begin
  if p_round_id is null or p_voter_id is null or p_contestant_id is null then
    return jsonb_build_object('ok', false, 'code', 'invalid_request');
  end if;

  -- Serialise against other votes and against open/close for this round.
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;

  -- Idempotency first: a retry after a lost response returns the accepted vote, even
  -- if the round has since closed.
  select v.contestant_id into v_existing
  from voting.votes v
  where v.round_id = p_round_id and v.voter_id = p_voter_id;
  if found then
    return jsonb_build_object('ok', true, 'code', 'already_voted',
                              'roundId', p_round_id, 'contestantId', v_existing);
  end if;

  select es.active_round_id into v_active from voting.event_state es where es.id;
  if v_active is distinct from p_round_id then
    return jsonb_build_object('ok', false, 'code', 'round_not_active');
  end if;

  if v_round.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'not_open', 'status', v_round.status);
  end if;

  if not exists (select 1 from voting.contestants c where c.id = p_contestant_id) then
    return jsonb_build_object('ok', false, 'code', 'invalid_contestant');
  end if;

  if p_client_hash is not null and coalesce(p_rate_limit_per_minute, 0) > 0 then
    insert into voting.rate_limits as rl (bucket, window_start, hits)
    values (p_client_hash, date_trunc('minute', now()), 1)
    on conflict (bucket, window_start) do update set hits = rl.hits + 1
    returning hits into v_hits;
    if v_hits = 1 then
      delete from voting.rate_limits where window_start < now() - interval '10 minutes';
    end if;
    if v_hits > p_rate_limit_per_minute then
      return jsonb_build_object('ok', false, 'code', 'rate_limited');
    end if;
  end if;

  insert into voting.votes (round_id, voter_id, contestant_id, client_hash)
  values (p_round_id, p_voter_id, p_contestant_id, p_client_hash);

  update voting.rounds set version = nextval('voting.state_version_seq') where id = p_round_id;

  v_snapshot := voting.round_snapshot(p_round_id);
  perform voting.broadcast(v_snapshot);

  return jsonb_build_object('ok', true, 'code', 'accepted',
                            'roundId', p_round_id, 'contestantId', p_contestant_id,
                            'version', v_snapshot -> 'version');
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin API (authenticated + allowlist re-checked inside every function)
-- ---------------------------------------------------------------------------

create function public.am_i_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select voting.is_admin(auth.uid());
$$;

create function public.admin_open_round(p_round_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_active   uuid;
  v_snapshot jsonb;
begin
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;
  select es.active_round_id into v_active from voting.event_state es where es.id;
  if v_active is distinct from p_round_id then
    return jsonb_build_object('ok', false, 'code', 'round_not_active', 'state', voting.active_snapshot());
  end if;
  if v_round.status = 'open' then
    return jsonb_build_object('ok', true, 'code', 'already_open', 'state', voting.round_snapshot(p_round_id));
  end if;
  if v_round.status <> 'waiting' then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition', 'state', voting.round_snapshot(p_round_id));
  end if;

  update voting.rounds
     set status = 'open', opened_at = now(), version = nextval('voting.state_version_seq')
   where id = p_round_id;

  insert into voting.admin_audit_log (admin_id, action, round_id) values (v_admin, 'open', p_round_id);

  v_snapshot := voting.round_snapshot(p_round_id);
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'opened', 'state', v_snapshot);
end;
$$;

-- Closing takes the same row lock as cast_vote. Once this commits, no further vote can
-- be inserted (cast_vote re-reads the status under the lock, and the insert trigger
-- re-checks it). The returned snapshot is the authoritative final result.
create function public.admin_close_round(p_round_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_snapshot jsonb;
begin
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;
  if v_round.status = 'closed' then
    return jsonb_build_object('ok', true, 'code', 'already_closed', 'state', voting.round_snapshot(p_round_id));
  end if;
  if v_round.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'invalid_transition', 'state', voting.round_snapshot(p_round_id));
  end if;

  update voting.rounds
     set status = 'closed', closed_at = now(), version = nextval('voting.state_version_seq')
   where id = p_round_id;

  v_snapshot := voting.round_snapshot(p_round_id);
  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'close', p_round_id, jsonb_build_object('total', v_snapshot -> 'total', 'results', v_snapshot -> 'results'));

  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'closed', 'state', v_snapshot);
end;
$$;

-- Creates a fresh round (new id) and makes it active. Previous rounds and their votes
-- are kept untouched. Refused while the current round is still open.
create function public.admin_create_round(p_label text, p_is_rehearsal boolean) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_current  voting.rounds%rowtype;
  v_new_id   uuid;
  v_snapshot jsonb;
  v_label    text := btrim(coalesce(p_label, ''));
begin
  if char_length(v_label) not between 1 and 120 then
    return jsonb_build_object('ok', false, 'code', 'invalid_label');
  end if;

  perform 1 from voting.event_state es where es.id for update;
  select r.* into v_current
  from voting.event_state es join voting.rounds r on r.id = es.active_round_id
  where es.id
  for update of r;
  if found and v_current.status = 'open' then
    return jsonb_build_object('ok', false, 'code', 'active_round_open', 'state', voting.round_snapshot(v_current.id));
  end if;

  insert into voting.rounds (label, is_rehearsal, created_by)
  values (v_label, coalesce(p_is_rehearsal, false), v_admin)
  returning id into v_new_id;

  insert into voting.event_state (id, active_round_id, updated_at)
  values (true, v_new_id, now())
  on conflict (id) do update set active_round_id = excluded.active_round_id, updated_at = now();

  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'create', v_new_id, jsonb_build_object('label', v_label, 'isRehearsal', coalesce(p_is_rehearsal, false)));

  v_snapshot := voting.round_snapshot(v_new_id);
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'created', 'state', v_snapshot);
end;
$$;

create function public.admin_list_rounds() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform voting.require_admin();
  return coalesce((
    select jsonb_agg(voting.round_snapshot(r.id) || jsonb_build_object('isActive', r.id = es.active_round_id)
                     order by r.created_at desc)
    from (select * from voting.rounds order by created_at desc limit 100) r
    cross join voting.event_state es
    where es.id
  ), '[]'::jsonb);
end;
$$;

create function public.admin_get_round(p_round_id uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform voting.require_admin();
  return voting.round_snapshot(p_round_id);
end;
$$;

-- Rehearsal-only helper so the AV team can watch the scoreboard move without phones.
-- Refuses any round that is not flagged is_rehearsal, so it can never touch the real
-- event round.
create function public.admin_simulate_votes(p_round_id uuid, p_count integer) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_active   uuid;
  v_snapshot jsonb;
begin
  if p_count is null or p_count < 1 or p_count > 200 then
    return jsonb_build_object('ok', false, 'code', 'invalid_count');
  end if;
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;
  if not v_round.is_rehearsal then
    return jsonb_build_object('ok', false, 'code', 'not_rehearsal');
  end if;
  select es.active_round_id into v_active from voting.event_state es where es.id;
  if v_active is distinct from p_round_id or v_round.status <> 'open' then
    return jsonb_build_object('ok', false, 'code', 'not_open');
  end if;

  insert into voting.votes (round_id, voter_id, contestant_id, client_hash)
  select p_round_id, gen_random_uuid(), c.id, 'rehearsal-simulation'
  from generate_series(1, p_count) g
  cross join lateral (
    select id from voting.contestants where g > 0 order by random() limit 1
  ) c;

  update voting.rounds set version = nextval('voting.state_version_seq') where id = p_round_id;
  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'simulate', p_round_id, jsonb_build_object('count', p_count));

  v_snapshot := voting.round_snapshot(p_round_id);
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'simulated', 'state', v_snapshot);
end;
$$;

-- Admin allowlist management. service_role only (used by `npm run admin:provision`).
create function public.provision_admin(p_user_id uuid, p_email text) returns void
language sql volatile security definer set search_path = '' as $$
  insert into voting.admin_users (user_id, email) values (p_user_id, lower(p_email))
  on conflict (user_id) do update set email = excluded.email;
$$;

create function public.revoke_admin(p_user_id uuid) returns void
language sql volatile security definer set search_path = '' as $$
  delete from voting.admin_users where user_id = p_user_id;
$$;

-- ---------------------------------------------------------------------------
-- Grants. Supabase grants EXECUTE on new public functions to anon/authenticated by
-- default, so every function is locked down explicitly.
-- ---------------------------------------------------------------------------

revoke all on function public.get_public_state()                                   from public, anon, authenticated;
revoke all on function public.get_voter_state(uuid)                                from public, anon, authenticated;
revoke all on function public.cast_vote(uuid, uuid, text, text, integer)           from public, anon, authenticated;
revoke all on function public.am_i_admin()                                         from public, anon, authenticated;
revoke all on function public.admin_open_round(uuid)                               from public, anon, authenticated;
revoke all on function public.admin_close_round(uuid)                              from public, anon, authenticated;
revoke all on function public.admin_create_round(text, boolean)                    from public, anon, authenticated;
revoke all on function public.admin_list_rounds()                                  from public, anon, authenticated;
revoke all on function public.admin_get_round(uuid)                                from public, anon, authenticated;
revoke all on function public.admin_simulate_votes(uuid, integer)                  from public, anon, authenticated;
revoke all on function public.provision_admin(uuid, text)                          from public, anon, authenticated;
revoke all on function public.revoke_admin(uuid)                                   from public, anon, authenticated;

grant execute on function public.get_public_state()                         to anon, authenticated, service_role;
grant execute on function public.get_voter_state(uuid)                      to service_role;
grant execute on function public.cast_vote(uuid, uuid, text, text, integer) to service_role;
grant execute on function public.am_i_admin()                               to authenticated;
grant execute on function public.admin_open_round(uuid)                     to authenticated;
grant execute on function public.admin_close_round(uuid)                    to authenticated;
grant execute on function public.admin_create_round(text, boolean)          to authenticated;
grant execute on function public.admin_list_rounds()                        to authenticated;
grant execute on function public.admin_get_round(uuid)                      to authenticated;
grant execute on function public.admin_simulate_votes(uuid, integer)        to authenticated;
grant execute on function public.provision_admin(uuid, text)                to service_role;
grant execute on function public.revoke_admin(uuid)                         to service_role;

-- ---------------------------------------------------------------------------
-- Realtime authorization: anyone may RECEIVE broadcasts on the private `scoreboard`
-- topic (it only ever carries aggregate snapshots). No INSERT policy exists, so
-- clients cannot send/spoof messages on it; only the database (realtime.send) can.
-- ---------------------------------------------------------------------------

create policy "scoreboard broadcasts are readable"
  on realtime.messages
  for select
  to anon, authenticated
  using (realtime.topic() = 'scoreboard' and realtime.messages.extension = 'broadcast');

-- ---------------------------------------------------------------------------
-- Reference data and the initial production round (starts at zero votes).
-- Keep in sync with src/config/contestants.ts (verified by tests/unit/config.test.ts).
-- ---------------------------------------------------------------------------

insert into voting.contestants (id, name, display_order) values
  ('yova',          'YOVA',          1),
  ('bubu-kosmetik', 'BUBU KOSMETIK', 2),
  ('seed-of-life',  'SEED OF LIFE',  3);

with first_round as (
  insert into voting.rounds (label, is_rehearsal)
  values ('Biznis Arena 2026 — гласање на публиката', false)
  returning id
)
insert into voting.event_state (id, active_round_id)
select true, id from first_round;
