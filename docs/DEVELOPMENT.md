# Development and Infrastructure

This guide covers the local services, environment variables, database workflow,
observability configuration, and verification commands used by the project. For
an overview of the game and application, start with the project
[`README`](../README.md).

## Prerequisites

- Node.js 22.22.2 or newer
- pnpm 9
- Docker

The Supabase CLI is installed as a development dependency and is available
through the `pnpm supabase:*` scripts.

## First-Time Setup

Install the project dependencies and create a local environment file:

```sh
pnpm install
cp .env.example .env
```

Start the local Supabase stack, apply all migrations, and load the preview seed:

```sh
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:status
```

Copy the values reported by `supabase:status` into `.env`:

| Supabase value  | Environment variable                   |
| --------------- | -------------------------------------- |
| API URL         | `NEXT_PUBLIC_SUPABASE_URL`             |
| Publishable key | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key      | `SUPABASE_SECRET_KEY`                  |

The secret key is server-only. Never expose it through a variable beginning
with `NEXT_PUBLIC_`. Existing deployments can temporarily use the legacy
`NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` aliases while
they migrate to the current names.

Observability is disabled during development by default. When working without a
PostHog project, use a non-empty local placeholder for
`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`; no development events will be sent.

Start Next.js after the environment is configured:

```sh
pnpm dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

## Supabase

Supabase is the application's persistence and realtime layer. Database changes
in `supabase/migrations` are the single source of truth for local, preview, and
production environments.

Create a migration for every schema change:

```sh
supabase migration new describe_the_change
```

Edit the generated SQL file, then rebuild the local database to verify the full
migration sequence:

```sh
pnpm supabase:reset
```

Do not edit the production database directly. If an emergency Dashboard change
is unavoidable, pull it into a migration before continuing development:

```sh
supabase db pull --db-url '<session-pooler-connection-string>'
```

### Game retention

Supabase runs a cleanup job every day at 04:15 UTC. Games that have not been
updated for seven days are deleted along with their seats and tokens through
foreign-key cascades.

## Observability

Production uses PostHog for anonymous product analytics, Web Vitals, client and
server error tracking, and limited structured server logs. Configure:

- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- `NEXT_PUBLIC_POSTHOG_HOST`

When using the managed reverse proxy, set `NEXT_PUBLIC_POSTHOG_HOST` to its URL
in the deployment environment. The PostHog UI and source-map CLI remain on the
direct US Cloud app host.

`NEXT_PUBLIC_DISABLE_OBSERVABILITY="true"` disables client analytics, client and
server error reporting, structured log export, and source-map uploads in every
environment. Automated tests set it to `true`; normal production deployments
should leave it set to `false`.

Readable client stack traces additionally require these server-only build
variables:

- `POSTHOG_API_KEY`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_CLI_HOST`

`POSTHOG_API_KEY` must have error-tracking write access. Production builds
upload source maps when the API key and project ID are both configured and fail
when only one is present. `POSTHOG_CLI_HOST` must remain the direct PostHog app
host rather than the managed proxy.

The integration disables person profiles, DOM autocapture, and session
recording. Diagnostic URLs, identifiers, messages, stacks, causes, and error
details are sent without application-level redaction. Credentials are excluded
at collection time: never add cookies, authorization headers, secret tokens, or
environment variables to analytics properties or operational logs.

Application code should use the vendor-neutral helpers in
`src/lib/observability` rather than importing a PostHog SDK directly. The three
signal types are deliberately separate:

- `trackEvent` records anonymous product behavior.
- `logger.info`, `logger.warn`, and `logger.error` write operational logs. Log
  severity never creates an Error Tracking issue.
- `captureException` records unexpected defects that require developer
  attention. Server exceptions also write one correlated operational log.

The module names reflect those boundaries: `logger.ts` owns operational logs,
`server-errors.ts` owns actionable server exception reporting, `context.ts`
builds and normalizes request/runtime metadata, and `error-details.ts` extracts
complete exception details. Client analytics and browser exception capture stay
in `client.ts`, with product event types in `events.ts`.

Expected application outcomes such as invalid input, missing games, stale
credentials, conflicts, rate limits, and temporary Realtime degradation are
logs, not exceptions. Unknown failures, broken internal contracts, and
unhandled exceptions belong in Error Tracking. Observability is fail-open:
reporting failures must never interrupt application behavior.

## Game Assets

Official character data and artwork are committed under `public/assets` so the
application does not depend on the toolmaker resource URLs at runtime. Refresh
them with:

```sh
pnpm sync:assets
```

These resources are not covered by the project's MIT License. See
[`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) before redistributing or
modifying them.

## Verification

Run the application checks before submitting a change:

```sh
pnpm check
pnpm test
pnpm test:coverage
pnpm build
pnpm audit --prod
```

With the local Supabase stack running, lint and test the database:

```sh
pnpm supabase:lint
pnpm test:db
```

### Multiplayer Integration Tests

The Playwright suite runs the real Next.js application against the local
Supabase database and Realtime service. Each Storyteller and player uses an
isolated browser context so credentials and browser state cannot leak between
actors.

The full multiplayer suite runs in desktop Chromium. Tests tagged `@smoke`
also run in an 844×390 tablet viewport and a 390×844 mobile WebKit viewport to
cover compact layouts and Safari behavior without multiplying every scenario.

Install the tested browser engines once on a new development machine:

```sh
pnpm exec playwright install chromium webkit
```

Start and reset Supabase, ensure `.env` contains the local credentials reported
by `supabase:status`, then run the suite:

```sh
pnpm supabase:start
pnpm supabase:reset
pnpm test:integration
```

Use `pnpm test:integration:ui` for Playwright's interactive runner and
`pnpm test:integration:report` to reopen the most recent HTML report. The
application runs on `http://localhost:3100` during these tests so it does not
compete with a normal development server on port 3000. The HTML report is
written to `integration-report/index.html`, and traces, screenshots, videos,
and other run artifacts are written to `integration-test-results/`.

The CI integration job runs for pull requests and pushes to `main`. It starts an
ephemeral local Supabase stack, rebuilds the database from migrations, exports
only the generated local credentials, runs pgTAP database tests, builds the
production application, and runs the full Chromium suite plus the tablet
Chromium smoke tests with one worker. A separate integration workflow adds the
mobile WebKit smoke tests after pushes to `main` and on manual dispatch. This
keeps WebKit's system dependency installation out of the required pull request
checks. Neither workflow connects to the hosted Supabase or PostHog projects.

CI browser runs upload the HTML report, with traces, screenshots, and videos
retained on failure, as the 14-day `integration-test-report` artifact. The
additional WebKit workflow uploads the same diagnostics as
`webkit-integration-report`. The independent unit test job uploads its HTML and
JSON coverage report as the 14-day `unit-test-coverage` artifact.

Same-repository pull requests receive one sticky comment that combines the unit
coverage totals with the browser pass, failure, flaky, and skipped totals;
duration; a viewer-local last-run time; failed test details; and links to both
pull request artifacts. Unit and browser tests remain separate CI checks and run
in parallel.

When adding tests, create a new game for every scenario, give every actor a
separate browser context, prefer accessible labels over test IDs, and wait on
observable UI or network state rather than fixed delays. Realtime assertions
must complete in less than the 15-second polling interval so polling cannot
hide a broken broadcast path.

Useful focused commands include:

| Command                          | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `pnpm lint`                      | Run ESLint                                   |
| `pnpm typecheck`                 | Run TypeScript without emitting files        |
| `pnpm format:check`              | Check supported source files with Prettier   |
| `pnpm test:coverage`             | Run unit/component tests with coverage gates |
| `pnpm test:db`                   | Run pgTAP database behavior tests            |
| `pnpm test:integration`          | Run the full browser integration matrix      |
| `pnpm test:integration:chromium` | Run the Chromium browser matrix              |
| `pnpm test:integration:webkit`   | Run the additional mobile WebKit tests       |
| `pnpm test:integration:smoke`    | Run responsive cross-browser smoke tests     |
| `pnpm test:integration:ui`       | Debug integration tests interactively        |
| `pnpm supabase:stop`             | Stop the local Supabase stack                |
