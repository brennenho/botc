create extension if not exists pg_cron with schema pg_catalog;

select cron.schedule(
  'botc-delete-expired-games',
  '15 4 * * *',
  $$
    delete from public.games
    where updated_at < now() - interval '7 days';
  $$
);
