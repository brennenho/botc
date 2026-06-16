# Blood on the Clocktower

## Development

- `pnpm install`
- `pnpm dev`

## Supabase

Create the database tables with `database/schema.sql`, then set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Without those variables, the app uses an in-memory development store so the UI
can still be exercised locally.
