alter table public.games
  add column custom_script jsonb,
  drop constraint games_edition_check,
  add constraint games_edition_check check (
    (edition in ('tb', 'bmr', 'snv') and custom_script is null)
    or (edition = 'custom' and custom_script is not null
        and jsonb_typeof(custom_script) = 'object'
        and custom_script ? 'roleIds'
        and jsonb_typeof(custom_script->'roleIds') = 'array'
        and jsonb_array_length(custom_script->'roleIds') between 1 and 200)
  );

create or replace function public.botc_create_game(
  p_game_id text,
  p_join_code text,
  p_edition text,
  p_player_count integer,
  p_storyteller_token_hash text,
  p_custom_script jsonb
)
returns table (game_id text, game_version integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_edition not in ('tb', 'bmr', 'snv', 'custom') then
    raise exception 'BOTC_INVALID_EDITION';
  end if;

  if p_game_id is null
    or length(btrim(p_join_code)) <> 6
    or length(btrim(p_storyteller_token_hash)) < 1
  then
    raise exception 'BOTC_INVALID_GAME';
  end if;

  if p_player_count < 5 or p_player_count > 20 then
    raise exception 'BOTC_INVALID_PLAYER_COUNT';
  end if;

  insert into public.games (
    id,
    join_code,
    edition,
    custom_script,
    storyteller_token_hash
  ) values (
    p_game_id,
    upper(btrim(p_join_code)),
    p_edition,
    p_custom_script,
    p_storyteller_token_hash
  );

  for seat_number in 0..p_player_count - 1 loop
    insert into public.seats (
      id,
      game_id,
      seat_index,
      player_name
    ) values (
      gen_random_uuid()::text,
      p_game_id,
      seat_number,
      format('Player %s', seat_number + 1)
    );
  end loop;

  return query select p_game_id, 1;
end;
$$;

revoke all on function public.botc_create_game(text, text, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.botc_create_game(text, text, text, integer, text, jsonb)
  to service_role;
