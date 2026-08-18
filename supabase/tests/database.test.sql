begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

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

delete from public.games where id = 'pgtap-game';
select is(
  (select count(*) from public.seats where game_id = 'pgtap-game'),
  0::bigint,
  'deleting a game cascades to its seats'
);

select * from finish();

rollback;
