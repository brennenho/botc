create table public.game_events (
  game_id text not null references public.games(id) on delete cascade,
  game_version integer not null,
  ordinal integer not null default 0,
  kind text not null check (kind = 'phase_started'),
  phase text not null check (phase in ('setup', 'night', 'day')),
  day_number integer not null check (day_number > 0),
  occurred_at timestamptz not null default now(),
  primary key (game_id, game_version, ordinal)
);

alter table public.game_events enable row level security;
revoke all on public.game_events from public, anon, authenticated, service_role;
grant select on public.game_events to service_role;

create function public.botc_record_phase_started()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.game_events (game_id, game_version, kind, phase, day_number)
  values (new.id, new.version, 'phase_started', new.phase, new.day_number);
  return new;
end;
$$;

revoke all on function public.botc_record_phase_started() from public, anon, authenticated;

create trigger record_phase_started
after update of phase, day_number on public.games
for each row when ((old.phase, old.day_number) is distinct from (new.phase, new.day_number))
execute function public.botc_record_phase_started();
