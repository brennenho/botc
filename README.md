# Blood on the Clocktower

An online grimoire for running Blood on the Clocktower games in person or with
connected players.

## Supabase

Supabase is the application's only persistence layer. Database changes live in
[`supabase/migrations`](supabase/migrations) and are the single source of truth
for local, preview, and production environments.

### Local Development

Local Supabase requires Docker and the Supabase CLI.

1. Start the local stack with `pnpm supabase:start`.
2. Apply all migrations and the preview seed with `pnpm supabase:reset`.
3. Run `pnpm supabase:status` and copy the local API URL, publishable key, and
   secret key into `.env` using the names in `.env.example`.
4. Start Next.js with `pnpm dev`.

The secret key is server-only. Never expose it in a public environment
variable or browser bundle. Existing deployments may continue using the legacy
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` aliases while
they are migrated to the current key names.

### Database Workflow

Create a migration for every schema change:

```sh
supabase migration new describe_the_change
```

Edit the generated SQL file, run `pnpm supabase:reset`, and commit the migration.
Do not edit the production database directly. If an emergency Dashboard change
is unavoidable, pull it into a migration before continuing development:

```sh
supabase db pull --db-url '<session-pooler-connection-string>'
```

### Game Retention

Supabase runs a daily cleanup job at 04:15 UTC. Games that have not been updated
for seven days are deleted along with their seats and tokens through
foreign-key cascades.

## Development

- Node.js 20.9 or newer
- `pnpm install`
- `pnpm dev`

## Verification

- `pnpm check`
- `pnpm test`
- `pnpm build`
- `pnpm audit --prod`
- `pnpm supabase:lint` with the local Supabase stack running

## Assets

Official character data and artwork are committed under `public/assets` so the
application does not depend on toolmaker resource URLs at runtime. Refresh them
with `pnpm sync:assets`.
