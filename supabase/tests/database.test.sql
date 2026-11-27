begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

select ok(to_regclass('public.games') is not null, 'games table exists');
select ok(to_regclass('public.seats') is not null, 'seats table exists');
select ok(to_regclass('public.game_tokens') is not null, 'game tokens table exists');

select ok(
  not has_table_privilege('anon', 'public.games', 'select'),
  'anonymous clients cannot select games'
);
select ok(
  not has_table_privilege('authenticated', 'public.seats', 'select'),
  'authenticated clients cannot select seats'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.botc_join_game(text,text,text)',
    'execute'
  ),
  'anonymous clients cannot execute join RPC directly'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.botc_join_game(text,text,text)',
    'execute'
  ),
  'service role can execute join RPC'
);

select lives_ok(
  $$
    select * from public.botc_create_game(
      'pgtap-game',
      'TST234',
      'tb',
      5,
      repeat('a', 64)
    )
  $$,
  'game creation RPC succeeds'
);
select is(
  (select count(*) from public.seats where game_id = 'pgtap-game'),
  5::bigint,
  'game creation makes the requested seats'
);

select ok(
  not has_function_privilege('anon', 'public.botc_create_game(text,text,text,integer,text,jsonb)', 'execute')
  and not has_function_privilege('authenticated', 'public.botc_create_game(text,text,text,integer,text,jsonb)', 'execute')
  and has_function_privilege('service_role', 'public.botc_create_game(text,text,text,integer,text,jsonb)', 'execute'),
  'the custom script creation RPC is restricted to the service role'
);
select lives_ok(
  $$select * from public.botc_create_game(
    'pgtap-custom', 'TST235', 'custom', 6, repeat('a', 64),
    '{"name":"Custom test","roleIds":["steward","monk","ogre","spy","kazali"]}'::jsonb
  )$$,
  'game creation accepts a custom script'
);
select is(
  (select custom_script from public.games where id = 'pgtap-custom'),
  '{"name":"Custom test","roleIds":["steward","monk","ogre","spy","kazali"]}'::jsonb,
  'the custom roster and its order are persisted'
);
select is(
  (select count(*) from public.seats where game_id = 'pgtap-custom'),
  6::bigint,
  'custom games get the requested seats'
);
select throws_like(
  $$select * from public.botc_create_game(
    'pgtap-empty', 'TST236', 'custom', 5, repeat('a', 64), null::jsonb
  )$$,
  '%games_edition_check%',
  'custom games require a script'
);

select lives_ok(
  $$
    select * from public.botc_join_game(
      'TST234',
      'Alice',
      repeat('b', 64)
    )
  $$,
  'player join RPC succeeds'
);
select is(
  (
    select count(*)
    from public.seats
    where game_id = 'pgtap-game' and player_token_hash is not null
  ),
  1::bigint,
  'a successful join claims exactly one seat'
);

select lives_ok(
  $$
    select * from public.botc_update_game(
      'TST234'::text,
      repeat('a', 64)::text,
      2::integer,
      'night'::text,
      2::integer,
      null::jsonb,
      null::jsonb
    )
  $$,
  'versioned Storyteller update succeeds'
);
select throws_like(
  $$
    select * from public.botc_update_game(
      'TST234'::text,
      repeat('a', 64)::text,
      2::integer,
      'day'::text,
      3::integer,
      null::jsonb,
      null::jsonb
    )
  $$,
  '%BOTC_VERSION_CONFLICT%',
  'a stale Storyteller update is rejected'
);
select is(
  (select phase || ':' || day_number::text || ':' || version::text from public.games where id = 'pgtap-game'),
  'night:2:3',
  'a rejected stale update does not overwrite the winner'
);

select results_eq(
  $$ select kind, phase, day_number, game_version from public.game_events where game_id = 'pgtap-game' $$,
  $$ values ('phase_started'::text, 'night'::text, 2, 3) $$,
  'only the successful phase change creates a history entry'
);
select ok(
  not has_table_privilege('anon', 'public.game_events', 'select')
  and not has_table_privilege('authenticated', 'public.game_events', 'select'),
  'game history is private to the server'
);

delete from public.games where id = 'pgtap-game';
select is(
  (select count(*) from public.game_events where game_id = 'pgtap-game'),
  0::bigint,
  'deleting a game removes its history'
);
select is(
  (select count(*) from public.seats where game_id = 'pgtap-game'),
  0::bigint,
  'deleting a game cascades to its seats'
);

select * from finish();

rollback;
