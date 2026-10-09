-- Rehearsal rounds can be deleted by an admin (with their simulated/test votes).
-- Production rounds and their votes stay append-only and undeletable: the triggers only
-- relax for a rehearsal round, and only inside admin_delete_rehearsal_round(), which sets
-- a transaction-local flag.

create or replace function voting.guard_round_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.is_rehearsal and current_setting('voting.rehearsal_purge', true) = 'on' then
      return old;
    end if;
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

create or replace function voting.reject_vote_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE'
     and current_setting('voting.rehearsal_purge', true) = 'on'
     and exists (select 1 from voting.rounds r where r.id = old.round_id and r.is_rehearsal) then
    return old;
  end if;
  raise exception 'recorded votes are append-only' using errcode = 'P0001';
end;
$$;

revoke all on function voting.guard_round_update() from public, anon, authenticated;
revoke all on function voting.reject_vote_mutation() from public, anon, authenticated;

create function public.admin_delete_rehearsal_round(p_round_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_round    voting.rounds%rowtype;
  v_active   uuid;
  v_next     uuid;
  v_votes    integer;
  v_snapshot jsonb;
begin
  perform 1 from voting.event_state es where es.id for update;
  select * into v_round from voting.rounds r where r.id = p_round_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'code', 'round_not_found');
  end if;
  if not v_round.is_rehearsal then
    return jsonb_build_object('ok', false, 'code', 'not_rehearsal');
  end if;
  if v_round.status = 'open' then
    return jsonb_build_object('ok', false, 'code', 'round_open');
  end if;

  select es.active_round_id into v_active from voting.event_state es where es.id;
  if v_active = p_round_id then
    -- Hand the public URLs back to the most recent production round (else any other round).
    select r.id into v_next
    from voting.rounds r
    where r.id <> p_round_id
    order by (not r.is_rehearsal) desc, r.created_at desc
    limit 1;
    if v_next is null then
      return jsonb_build_object('ok', false, 'code', 'no_other_round');
    end if;
    update voting.event_state
       set active_round_id = v_next,
           version = nextval('voting.state_version_seq'),
           updated_at = now()
     where id;
  end if;

  perform set_config('voting.rehearsal_purge', 'on', true);
  delete from voting.votes where round_id = p_round_id;
  get diagnostics v_votes = row_count;
  delete from voting.rounds where id = p_round_id;
  perform set_config('voting.rehearsal_purge', 'off', true);

  insert into voting.admin_audit_log (admin_id, action, round_id, details)
  values (v_admin, 'delete_rehearsal', p_round_id,
          jsonb_build_object('label', v_round.label, 'votes', v_votes, 'wasActive', v_active = p_round_id));

  v_snapshot := voting.active_snapshot();
  if v_active = p_round_id then
    perform voting.broadcast(v_snapshot);
  end if;
  return jsonb_build_object('ok', true, 'code', 'deleted', 'deletedVotes', v_votes, 'state', v_snapshot);
end;
$$;

revoke all on function public.admin_delete_rehearsal_round(uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_rehearsal_round(uuid) to authenticated;
