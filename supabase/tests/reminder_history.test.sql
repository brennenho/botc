begin;
create extension if not exists pgtap with schema extensions;
select plan(3);

select * from public.botc_create_game('reminder-test', 'REM234', 'tb', 5, repeat('a', 64));

create function pg_temp.tokens_for_seat(seat_number integer, token_position integer)
returns jsonb language sql as $$
  select jsonb_build_array(
    jsonb_build_object('id', 'poison', 'tokenType', 'reminder', 'label', 'Poisoned',
      'roleId', 'poisoner', 'seatId', id, 'position', token_position),
    jsonb_build_object('id', 'bluff', 'tokenType', 'bluff', 'label', 'Monk', 'position', 0)
  )
  from public.seats where game_id = 'reminder-test' and seat_index = seat_number;
$$;

select * from public.botc_update_game('REM234', repeat('a', 64), 1,
  p_phase => 'night', p_game_tokens => pg_temp.tokens_for_seat(0, 0));
select * from public.botc_update_game('REM234', repeat('a', 64), 2,
  p_game_tokens => pg_temp.tokens_for_seat(0, 1));
select * from public.botc_update_game('REM234', repeat('a', 64), 3,
  p_game_tokens => pg_temp.tokens_for_seat(1, 0));

select throws_like(
  $$select * from public.botc_update_game('REM234', repeat('a', 64), 3, p_game_tokens => '[]')$$,
  '%BOTC_VERSION_CONFLICT%', 'a stale removal is rejected'
);
-- Deleting seats also removes their reminders, even without a token payload.
select * from public.botc_update_game('REM234', repeat('a', 64), 4, p_seats => '[]');

select results_eq(
  $$select game_version, ordinal, kind, reminder->>'playerName', reminder->>'label', reminder->>'roleId'
    from public.game_events where game_id = 'reminder-test' order by game_version, ordinal$$,
  $$values
    (2, 0, 'phase_started', null, null, null),
    (2, 1, 'reminder_placed', 'Player 1', 'Poisoned', 'poisoner'),
    (4, 1, 'reminder_removed', 'Player 1', 'Poisoned', 'poisoner'),
    (4, 2, 'reminder_placed', 'Player 2', 'Poisoned', 'poisoner'),
    (5, 1, 'reminder_removed', 'Player 2', 'Poisoned', 'poisoner')$$,
  'only placement changes create reminder events, with names preserved after seat deletion'
);

select ok(
  not has_function_privilege('anon', 'public.botc_update_game(text,text,integer,text,integer,jsonb,jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.botc_reminder_placements(text)', 'execute')
  and not has_function_privilege('service_role', 'public.botc_apply_game_patch(text,text,integer,text,integer,jsonb,jsonb)', 'execute'),
  'the server uses the versioned update with history as its only patch entry point'
);
select * from finish();
rollback;
