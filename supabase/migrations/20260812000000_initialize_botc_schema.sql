-- Canonical schema for local development, preview branches, and production.
-- This migration is idempotent so it can safely baseline an existing project.

create table if not exists public.games (
  id text primary key,
  join_code text not null unique,
  edition text not null check (edition in ('tb', 'bmr', 'snv')),
  status text not null default 'active' check (status in ('active', 'archived')),
  phase text not null default 'setup' check (phase in ('setup', 'day', 'night', 'finished')),
  day_number integer not null default 1 check (day_number > 0),
  version integer not null default 1,
  storyteller_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seats (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  seat_index integer not null,
  player_name text not null,
  player_token_hash text,
  role_id text,
  alignment text not null default 'good' check (alignment in ('good', 'evil')),
  alive boolean not null default true,
  ghost_vote_available boolean not null default true,
  is_traveller boolean not null default false,
  joined_at timestamptz not null default now()
);

drop index if exists public.seats_game_id_seat_index_idx;
drop index if exists public.seats_game_id_seat_index_uidx;
alter table public.seats
  drop constraint if exists seats_game_id_seat_index_key;
alter table public.seats
  drop constraint if exists seats_game_seat_index_unique;
alter table public.seats
  add constraint seats_game_seat_index_unique
  unique (game_id, seat_index)
  deferrable initially immediate;

create table if not exists public.game_tokens (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  seat_id text references public.seats(id) on delete cascade,
  token_type text not null check (token_type in ('reminder', 'bluff', 'custom')),
  role_id text,
  label text not null,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.games
  drop constraint if exists games_join_code_format;
alter table public.games
  add constraint games_join_code_format
  check (join_code ~ '^[A-HJ-NP-Z2-9]{6}$');
alter table public.games
  drop constraint if exists games_version_positive;
alter table public.games
  add constraint games_version_positive check (version > 0);

alter table public.seats
  drop constraint if exists seats_seat_index_nonnegative;
alter table public.seats
  add constraint seats_seat_index_nonnegative check (seat_index >= 0);
alter table public.seats
  drop constraint if exists seats_player_name_length;
alter table public.seats
  add constraint seats_player_name_length
  check (length(btrim(player_name)) between 1 and 40);

alter table public.game_tokens
  drop constraint if exists game_tokens_label_length;
alter table public.game_tokens
  add constraint game_tokens_label_length
  check (length(btrim(label)) between 1 and 80);
alter table public.game_tokens
  drop constraint if exists game_tokens_position_nonnegative;
alter table public.game_tokens
  add constraint game_tokens_position_nonnegative check (position >= 0);
alter table public.game_tokens
  drop constraint if exists game_tokens_metadata_object;
alter table public.game_tokens
  add constraint game_tokens_metadata_object
  check (jsonb_typeof(metadata) = 'object');

create index if not exists game_tokens_game_id_position_idx
  on public.game_tokens(game_id, position);

drop table if exists public.game_events cascade;

alter table public.games enable row level security;
alter table public.seats enable row level security;
alter table public.game_tokens enable row level security;

drop policy if exists "Anonymous clients can observe game versions" on public.games;
drop policy if exists "Server key manages games" on public.games;
drop policy if exists "Server key manages seats" on public.seats;
drop policy if exists "Server key manages game tokens" on public.game_tokens;

create policy "Server key manages games"
  on public.games
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Server key manages seats"
  on public.seats
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Server key manages game tokens"
  on public.game_tokens
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

revoke all on public.games from anon, authenticated;
revoke all on public.seats from anon, authenticated;
revoke all on public.game_tokens from anon, authenticated;

grant select on public.games to service_role;
grant select on public.seats to service_role;
grant select on public.game_tokens to service_role;

create or replace function public.botc_create_game(
  p_game_id text,
  p_join_code text,
  p_edition text,
  p_player_count integer,
  p_storyteller_token_hash text
)
returns table (game_id text, game_version integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_edition not in ('tb', 'bmr', 'snv') then
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
    storyteller_token_hash
  ) values (
    p_game_id,
    upper(btrim(p_join_code)),
    p_edition,
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

create or replace function public.botc_join_game(
  p_join_code text,
  p_player_name text,
  p_player_token_hash text
)
returns table (game_id text, seat_id text, game_version integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_game public.games%rowtype;
  selected_seat public.seats%rowtype;
  next_version integer;
begin
  if length(btrim(p_player_name)) < 1 or length(btrim(p_player_name)) > 40 then
    raise exception 'BOTC_INVALID_PLAYER_NAME';
  end if;

  if length(btrim(p_player_token_hash)) < 1 then
    raise exception 'BOTC_INVALID_PLAYER_CREDENTIAL';
  end if;

  select game.* into selected_game
  from public.games as game
  where game.join_code = upper(btrim(p_join_code))
  for update;

  if not found then
    raise exception 'BOTC_GAME_NOT_FOUND';
  end if;

  if selected_game.status <> 'active' then
    raise exception 'BOTC_GAME_ARCHIVED';
  end if;

  select seat.* into selected_seat
  from public.seats as seat
  where seat.game_id = selected_game.id
    and seat.player_token_hash is null
  order by seat.seat_index
  for update skip locked
  limit 1;

  if not found then
    raise exception 'BOTC_NO_OPEN_SEATS';
  end if;

  update public.seats as seat
  set player_name = btrim(p_player_name),
      player_token_hash = p_player_token_hash,
      joined_at = now()
  where seat.id = selected_seat.id
    and seat.game_id = selected_game.id;

  next_version := selected_game.version + 1;

  update public.games as game
  set version = next_version,
      updated_at = now()
  where game.id = selected_game.id;

  return query select selected_game.id, selected_seat.id, next_version;
end;
$$;

create or replace function public.botc_update_game(
  p_join_code text,
  p_storyteller_token_hash text,
  p_expected_version integer,
  p_phase text default null,
  p_day_number integer default null,
  p_status text default null,
  p_seats jsonb default null,
  p_game_tokens jsonb default null
)
returns table (game_id text, game_version integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  selected_game public.games%rowtype;
  item jsonb;
  item_id text;
  item_seat_id text;
  next_version integer;
begin
  select game.* into selected_game
  from public.games as game
  where game.join_code = upper(btrim(p_join_code))
  for update;

  if not found then
    raise exception 'BOTC_GAME_NOT_FOUND';
  end if;

  if selected_game.storyteller_token_hash <> p_storyteller_token_hash then
    raise exception 'BOTC_UNAUTHORIZED';
  end if;

  if selected_game.version <> p_expected_version then
    raise exception 'BOTC_VERSION_CONFLICT';
  end if;

  set constraints seats_game_seat_index_unique deferred;

  if p_phase is not null and p_phase not in ('setup', 'day', 'night', 'finished') then
    raise exception 'BOTC_INVALID_PHASE';
  end if;

  if p_status is not null and p_status not in ('active', 'archived') then
    raise exception 'BOTC_INVALID_STATUS';
  end if;

  if p_day_number is not null and p_day_number < 1 then
    raise exception 'BOTC_INVALID_DAY_NUMBER';
  end if;

  if p_seats is not null then
    if jsonb_typeof(p_seats) <> 'array' or jsonb_array_length(p_seats) > 20 then
      raise exception 'BOTC_INVALID_SEATS';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_seats) proposed
      group by proposed->>'id'
      having count(*) > 1
    ) or exists (
      select 1
      from jsonb_array_elements(p_seats) proposed
      group by (proposed->>'seatIndex')::integer
      having count(*) > 1
    ) then
      raise exception 'BOTC_DUPLICATE_SEATS';
    end if;

    if exists (
      select 1
      from public.seats existing
      join jsonb_array_elements(p_seats) proposed
        on existing.id = proposed->>'id'
      where existing.game_id <> selected_game.id
    ) then
      raise exception 'BOTC_FOREIGN_SEAT';
    end if;

    for item in select value from jsonb_array_elements(p_seats) loop
      item_id := item->>'id';

      if item_id is null
        or length(btrim(item->>'playerName')) < 1
        or length(btrim(item->>'playerName')) > 40
        or (item->>'seatIndex')::integer < 0
      then
        raise exception 'BOTC_INVALID_SEAT';
      end if;

      if exists (
        select 1 from public.seats as seat
        where seat.id = item_id and seat.game_id = selected_game.id
      ) then
        update public.seats as seat
        set seat_index = (item->>'seatIndex')::integer,
            player_name = btrim(item->>'playerName'),
            role_id = nullif(item->>'roleId', ''),
            alignment = item->>'alignment',
            alive = (item->>'alive')::boolean,
            ghost_vote_available = (item->>'ghostVoteAvailable')::boolean,
            is_traveller = (item->>'isTraveller')::boolean
        where seat.id = item_id and seat.game_id = selected_game.id;
      else
        insert into public.seats (
          id,
          game_id,
          seat_index,
          player_name,
          role_id,
          alignment,
          alive,
          ghost_vote_available,
          is_traveller
        ) values (
          item_id,
          selected_game.id,
          (item->>'seatIndex')::integer,
          btrim(item->>'playerName'),
          nullif(item->>'roleId', ''),
          item->>'alignment',
          (item->>'alive')::boolean,
          (item->>'ghostVoteAvailable')::boolean,
          (item->>'isTraveller')::boolean
        );
      end if;
    end loop;

    delete from public.seats existing
    where existing.game_id = selected_game.id
      and not exists (
        select 1 from jsonb_array_elements(p_seats) proposed
        where proposed->>'id' = existing.id
      );
  end if;

  if p_game_tokens is not null then
    if jsonb_typeof(p_game_tokens) <> 'array' or jsonb_array_length(p_game_tokens) > 250 then
      raise exception 'BOTC_INVALID_TOKENS';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(p_game_tokens) proposed
      group by proposed->>'id'
      having count(*) > 1
    ) then
      raise exception 'BOTC_DUPLICATE_TOKENS';
    end if;

    if exists (
      select 1
      from public.game_tokens existing
      join jsonb_array_elements(p_game_tokens) proposed
        on existing.id = proposed->>'id'
      where existing.game_id <> selected_game.id
    ) then
      raise exception 'BOTC_FOREIGN_TOKEN';
    end if;

    for item in select value from jsonb_array_elements(p_game_tokens) loop
      item_id := item->>'id';
      item_seat_id := nullif(item->>'seatId', '');

      if item_id is null
        or length(btrim(item->>'label')) < 1
        or length(btrim(item->>'label')) > 80
        or (item->>'position')::integer < 0
        or jsonb_typeof(coalesce(item->'metadata', '{}'::jsonb)) <> 'object'
      then
        raise exception 'BOTC_INVALID_TOKEN';
      end if;

      if item_seat_id is not null and not exists (
        select 1 from public.seats as seat
        where seat.id = item_seat_id and seat.game_id = selected_game.id
      ) then
        raise exception 'BOTC_FOREIGN_TOKEN_SEAT';
      end if;
    end loop;

    delete from public.game_tokens as token
    where token.game_id = selected_game.id;

    insert into public.game_tokens (
      id,
      game_id,
      seat_id,
      token_type,
      role_id,
      label,
      position,
      metadata
    )
    select
      proposed->>'id',
      selected_game.id,
      nullif(proposed->>'seatId', ''),
      proposed->>'tokenType',
      nullif(proposed->>'roleId', ''),
      btrim(proposed->>'label'),
      (proposed->>'position')::integer,
      coalesce(proposed->'metadata', '{}'::jsonb)
    from jsonb_array_elements(p_game_tokens) proposed;
  end if;

  next_version := selected_game.version + 1;

  update public.games as game
  set phase = coalesce(p_phase, phase),
      day_number = coalesce(p_day_number, day_number),
      status = coalesce(p_status, status),
      version = next_version,
      updated_at = now()
  where game.id = selected_game.id and game.version = p_expected_version;

  if not found then
    raise exception 'BOTC_VERSION_CONFLICT';
  end if;

  return query select selected_game.id, next_version;
end;
$$;

revoke all on function public.botc_create_game(text, text, text, integer, text)
  from public, anon, authenticated;
revoke all on function public.botc_join_game(text, text, text)
  from public, anon, authenticated;
revoke all on function public.botc_update_game(text, text, integer, text, integer, text, jsonb, jsonb)
  from public, anon, authenticated;

grant execute on function public.botc_create_game(text, text, text, integer, text)
  to service_role;
grant execute on function public.botc_join_game(text, text, text)
  to service_role;
grant execute on function public.botc_update_game(text, text, integer, text, integer, text, jsonb, jsonb)
  to service_role;

do $$
begin
  alter publication supabase_realtime drop table public.games;
exception
  when undefined_object or object_not_in_prerequisite_state then null;
end $$;
