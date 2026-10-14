-- Voting timer.
--
-- When an admin opens a round with a duration, the round stores a deadline (closes_at).
-- The deadline is enforced by the database, not by browsers:
--   * cast_vote (and the vote insert trigger) refuse votes once now() >= closes_at, and the
--     first late request closes the round on the spot;
--   * public.expire_round() closes the active round once its deadline has passed. Anyone may
--     call it (the LED screen and the control room call it at zero); it can never close a
--     round early, so it needs no authorisation.
-- Snapshots carry closesAt plus serverTime so screens can show a countdown that is correct
-- even when the AV laptop's clock is wrong.

alter table voting.rounds
  add column closes_at timestamptz,
  add constraint rounds_deadline_after_open check (
    closes_at is null or (opened_at is not null and closes_at > opened_at)
  );

create or replace function voting.round_snapshot(p_round_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', greatest(r.version, coalesce(es.version, 0)),
    'screenLocale', coalesce(es.screen_locale, 'mk'),
    'serverTime', clock_timestamp(),
    'round', jsonb_build_object(
      'id', r.id,
      'label', r.label,
      'isRehearsal', r.is_rehearsal,
      'status', r.status,
      'createdAt', r.created_at,
      'openedAt', r.opened_at,
      'closedAt', r.closed_at,
      'closesAt', r.closes_at
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
  left join voting.event_state es on es.id
  where r.id = p_round_id;
$$;

create or replace function voting.active_snapshot() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(
    (select voting.round_snapshot(es.active_round_id) from voting.event_state es where es.id),
    jsonb_build_object('version', 0, 'screenLocale', 'mk', 'serverTime', clock_timestamp(),
                       'round', null, 'results', '[]'::jsonb, 'total', 0)
  );
$$;

-- Defence in depth: the insert trigger also refuses votes after the deadline.
create or replace function voting.guard_vote_insert() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_status voting.round_status;
  v_closes timestamptz;
begin
  select r.status, r.closes_at into v_status, v_closes from voting.rounds r where r.id = new.round_id;
  if v_status is distinct from 'open' then
    raise exception 'votes can only be recorded while the round is open' using errcode = 'P0001';
  end if;
  if v_closes is not null and now() >= v_closes then
    raise exception 'voting time is over' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Closes an open round whose deadline has passed. Caller must hold the round row lock.
create function voting.close_expired(p_round_id uuid) returns boolean
language plpgsql set search_path = '' as $$
declare
  v_round    voting.rounds%rowtype;
  v_snapshot jsonb;
begin
  select * into v_round from voting.rounds r where r.id = p_round_id;
  if v_round.status <> 'open' or v_round.closes_at is null or now() < v_round.closes_at then
    return false;
  end if;
  update voting.rounds
     set status = 'closed',
         closed_at = greatest(v_round.closes_at, v_round.opened_at + interval '1 millisecond'),
         version = nextval('voting.state_version_seq')
   where id = p_round_id;
  v_snapshot := voting.round_snapshot(p_round_id);
  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (null, 'auto_close', p_round_id, jsonb_build_object('total', v_snapshot -> 'total', 'results', v_snapshot -> 'results'));
  perform voting.broadcast(v_snapshot);
  return true;
end;
$$;

revoke all on function voting.round_snapshot(uuid) from public, anon, authenticated;
revoke all on function voting.active_snapshot() from public, anon, authenticated;
revoke all on function voting.guard_vote_insert() from public, anon, authenticated;
revoke all on function voting.close_expired(uuid) from public, anon, authenticated;

create or replace function public.cast_vote(
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

  -- Time is up: close the round now (first late request does it) and refuse the vote.
  if v_round.closes_at is not null and now() >= v_round.closes_at then
    perform voting.close_expired(p_round_id);
    return jsonb_build_object('ok', false, 'code', 'not_open', 'status', 'closed');
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

-- Open with an optional duration (seconds). Replaces the one-argument version.
drop function public.admin_open_round(uuid);

create function public.admin_open_round(p_round_id uuid, p_duration_seconds integer default null) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_active   uuid;
  v_snapshot jsonb;
begin
  if p_duration_seconds is not null and (p_duration_seconds < 10 or p_duration_seconds > 3600) then
    return jsonb_build_object('ok', false, 'code', 'invalid_duration');
  end if;
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
     set status = 'open',
         opened_at = now(),
         closes_at = case when p_duration_seconds is null then null
                          else now() + make_interval(secs => p_duration_seconds) end,
         version = nextval('voting.state_version_seq')
   where id = p_round_id;

  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'open', p_round_id, jsonb_build_object('durationSeconds', p_duration_seconds));

  v_snapshot := voting.round_snapshot(p_round_id);
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'opened', 'state', v_snapshot);
end;
$$;

-- Adds time to a running timer (e.g. +30 s). Total length is capped at one hour.
create function public.admin_extend_round(p_round_id uuid, p_seconds integer) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_new      timestamptz;
  v_snapshot jsonb;
begin
  if p_seconds is null or p_seconds < 5 or p_seconds > 600 then
    return jsonb_build_object('ok', false, 'code', 'invalid_duration');
  end if;
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;
  if v_round.status <> 'open' or v_round.closes_at is null then
    return jsonb_build_object('ok', false, 'code', 'no_timer', 'state', voting.round_snapshot(p_round_id));
  end if;
  if now() >= v_round.closes_at then
    perform voting.close_expired(p_round_id);
    return jsonb_build_object('ok', false, 'code', 'time_over', 'state', voting.round_snapshot(p_round_id));
  end if;
  v_new := least(v_round.closes_at + make_interval(secs => p_seconds), v_round.opened_at + interval '1 hour');

  update voting.rounds
     set closes_at = v_new, version = nextval('voting.state_version_seq')
   where id = p_round_id;
  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'extend', p_round_id, jsonb_build_object('seconds', p_seconds));

  v_snapshot := voting.round_snapshot(p_round_id);
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'extended', 'state', v_snapshot);
end;
$$;

-- Public and harmless: only ever closes the active round after its deadline has passed.
create function public.expire_round() returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_active uuid;
  v_closed boolean := false;
begin
  select es.active_round_id into v_active from voting.event_state es where es.id;
  if v_active is null then
    return jsonb_build_object('ok', true, 'code', 'no_round', 'state', voting.active_snapshot());
  end if;
  perform 1 from voting.rounds r
   where r.id = v_active and r.status = 'open' and r.closes_at is not null and now() >= r.closes_at
   for update;
  if found then
    v_closed := voting.close_expired(v_active);
  end if;
  return jsonb_build_object('ok', true, 'code', case when v_closed then 'closed' else 'not_due' end,
                            'state', voting.active_snapshot());
end;
$$;

revoke all on function public.admin_open_round(uuid, integer) from public, anon, authenticated;
revoke all on function public.admin_extend_round(uuid, integer) from public, anon, authenticated;
revoke all on function public.expire_round() from public, anon, authenticated;
revoke all on function public.cast_vote(uuid, uuid, text, text, integer) from public, anon, authenticated;

grant execute on function public.admin_open_round(uuid, integer) to authenticated;
grant execute on function public.admin_extend_round(uuid, integer) to authenticated;
grant execute on function public.expire_round() to anon, authenticated, service_role;
grant execute on function public.cast_vote(uuid, uuid, text, text, integer) to service_role;
