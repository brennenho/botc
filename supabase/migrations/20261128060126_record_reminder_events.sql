alter table public.game_events
  drop constraint game_events_kind_check,
  add constraint game_events_kind_check check (kind in ('phase_started', 'reminder_placed', 'reminder_removed')),
  add column reminder jsonb,
  add check ((kind = 'phase_started') = (reminder is null));

create function public.botc_reminder_placements(p_game_id text)
returns jsonb
language sql stable
set search_path = ''
as $$
  select coalesce(jsonb_object_agg(t.id, jsonb_build_object(
    'seatId', t.seat_id, 'playerName', s.player_name, 'label', t.label, 'roleId', t.role_id
  )), '{}'::jsonb)
  from public.game_tokens t
  left join public.seats s on s.id = t.seat_id
  where t.game_id = p_game_id and t.token_type = 'reminder';
$$;

-- The patch replaces the entire token list. Compare placements on either side of
-- that write so a layout change creates no history and a deleted seat keeps its name.
alter function public.botc_update_game(text, text, integer, text, integer, jsonb, jsonb)
  rename to botc_apply_game_patch;

create function public.botc_update_game(
  p_join_code text, p_storyteller_token_hash text, p_expected_version integer,
  p_phase text default null, p_day_number integer default null,
  p_seats jsonb default null, p_game_tokens jsonb default null
)
returns table (game_id text, game_version integer)
language plpgsql security definer
set search_path = ''
as $$
declare
  placements_before jsonb;
  placements_after jsonb;
begin
  if p_game_tokens is not null or p_seats is not null then
    select public.botc_reminder_placements(g.id) into placements_before
    from public.games g
    where g.join_code = upper(btrim(p_join_code))
      and g.storyteller_token_hash = p_storyteller_token_hash
      and g.version = p_expected_version
    for update;
  end if;

  select patch.game_id, patch.game_version into game_id, game_version
  from public.botc_apply_game_patch(
    p_join_code, p_storyteller_token_hash, p_expected_version,
    p_phase, p_day_number, p_seats, p_game_tokens
  ) patch;

  if placements_before is not null then
    placements_after := public.botc_reminder_placements(game_id);
    with changes as (
      select 'reminder_removed' as kind, r.key as token_id, r.value as reminder
      from jsonb_each(placements_before) r
      where placements_after -> r.key -> 'seatId' is distinct from r.value -> 'seatId'
      union all
      select 'reminder_placed', r.key, r.value
      from jsonb_each(placements_after) r
      where placements_before -> r.key -> 'seatId' is distinct from r.value -> 'seatId'
    )
    insert into public.game_events (game_id, game_version, ordinal, phase, day_number, kind, reminder)
    select g.id, g.version, row_number() over (order by kind = 'reminder_placed', token_id),
           g.phase, g.day_number, changes.kind, changes.reminder
    from public.games g cross join changes
    where g.id = botc_update_game.game_id;
  end if;
  return next;
end;
$$;

revoke all on function public.botc_reminder_placements(text),
  public.botc_apply_game_patch(text, text, integer, text, integer, jsonb, jsonb)
  from public, anon, authenticated, service_role;
revoke all on function public.botc_update_game(text, text, integer, text, integer, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.botc_update_game(text, text, integer, text, integer, jsonb, jsonb)
  to service_role;
