-- LED screen language, chosen by organizers in /admin and switched live.
--
-- The language lives on the singleton event_state row. Changing it must reach the screen
-- through the same versioned snapshot stream, but closed rounds are immutable (their
-- version cannot move). event_state therefore carries its own version from the same
-- global sequence, and a snapshot's version is greatest(round.version, event_state.version):
-- still strictly increasing for every change clients can observe.

alter table voting.event_state
  add column screen_locale text not null default 'mk'
    check (screen_locale in ('mk', 'en', 'sv', 'sq', 'tr')),
  add column version bigint not null default 0;

create or replace function voting.round_snapshot(p_round_id uuid) returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', greatest(r.version, coalesce(es.version, 0)),
    'screenLocale', coalesce(es.screen_locale, 'mk'),
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
  left join voting.event_state es on es.id
  where r.id = p_round_id;
$$;

create or replace function voting.active_snapshot() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(
    (select voting.round_snapshot(es.active_round_id) from voting.event_state es where es.id),
    jsonb_build_object('version', 0, 'screenLocale', 'mk', 'round', null, 'results', '[]'::jsonb, 'total', 0)
  );
$$;

revoke all on function voting.round_snapshot(uuid) from public, anon, authenticated;
revoke all on function voting.active_snapshot() from public, anon, authenticated;

create function public.admin_set_screen_locale(p_locale text) returns jsonb
language plpgsql volatile security definer set search_path = '' set lock_timeout = '5s' as $$
declare
  v_admin    uuid := voting.require_admin();
  v_snapshot jsonb;
begin
  if p_locale is null or p_locale not in ('mk', 'en', 'sv', 'sq', 'tr') then
    return jsonb_build_object('ok', false, 'code', 'invalid_locale');
  end if;

  update voting.event_state
     set screen_locale = p_locale,
         version = nextval('voting.state_version_seq'),
         updated_at = now()
   where id;

  insert into voting.admin_audit_log (admin_id, action, details)
  values (v_admin, 'screen_locale', jsonb_build_object('locale', p_locale));

  v_snapshot := voting.active_snapshot();
  perform voting.broadcast(v_snapshot);
  return jsonb_build_object('ok', true, 'code', 'locale_set', 'state', v_snapshot);
end;
$$;

revoke all on function public.admin_set_screen_locale(text) from public, anon, authenticated;
grant execute on function public.admin_set_screen_locale(text) to authenticated;
