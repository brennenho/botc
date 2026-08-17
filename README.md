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

## PostHog

Production uses PostHog for anonymous product analytics, Web Vitals, client and
server error tracking, and limited structured server logs. Configure
`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in the
deployment environment. Development capture is off by default; set
`NEXT_PUBLIC_POSTHOG_CAPTURE_IN_DEVELOPMENT=true` only when testing the
integration against PostHog.

For readable client stack traces, also configure the server-only
`POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, and `POSTHOG_CLI_HOST` variables. The
personal API key must have error-tracking write access. Production builds
upload source maps when the key and project ID are both present and fail when
only one is configured.

The integration intentionally disables person profiles, DOM autocapture, and
session recording. Analytics URLs are sanitized before transmission so game
codes, seat IDs, query strings, and fragments are not sent to PostHog. Do not
add player names, game credentials, character assignments, or reminder content
to analytics properties or operational logs.

Application code must use the vendor-neutral helpers in
`src/lib/observability` (`trackEvent` and `reportError`) rather than importing a
PostHog SDK directly. Observability is fail-open: reporting failures are logged
locally and must never interrupt application behavior.

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
