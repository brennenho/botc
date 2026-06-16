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

create index if not exists seats_game_id_seat_index_idx
  on public.seats(game_id, seat_index);

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

create index if not exists game_tokens_game_id_position_idx
  on public.game_tokens(game_id, position);

create table if not exists public.game_events (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  actor_type text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists game_events_game_id_created_at_idx
  on public.game_events(game_id, created_at desc);

alter table public.games enable row level security;
alter table public.seats enable row level security;
alter table public.game_tokens enable row level security;
alter table public.game_events enable row level security;

drop policy if exists "Server key manages games" on public.games;
drop policy if exists "Server key manages seats" on public.seats;
drop policy if exists "Server key manages game tokens" on public.game_tokens;
drop policy if exists "Server key manages game events" on public.game_events;

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

create policy "Server key manages game events"
  on public.game_events
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Anonymous clients can observe game versions" on public.games;

create policy "Anonymous clients can observe game versions"
  on public.games
  for select
  using (true);

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
end $$;
