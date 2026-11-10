-- Bookkeeping for scripts/migrate.ts. It lives in the public schema, so
-- PostgREST exposes it; nothing outside the migration runner should reach it.
-- The runner connects as the table owner, which bypasses RLS.
alter table public.schema_migrations enable row level security;

revoke all on public.schema_migrations from anon, authenticated;
