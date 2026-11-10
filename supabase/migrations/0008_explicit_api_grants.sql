-- From 2026-10-30 Supabase stops granting Data API access to new tables in
-- "public" automatically. Our tables already have grants, but the schema has to
-- state them so a fresh project, preview branch or local reset still works.
--
-- Deliberately narrower than the old defaults:
--   * visitors only ever read the catalogue;
--   * TRUNCATE is NOT filtered by row-level security, so no API role gets it.
-- Writes stay gated by the policies in 0003; these grants are a second lock.
revoke all on public.books from anon, authenticated;

grant select on public.books to anon;
grant select, insert, update, delete on public.books to authenticated;
grant all on public.books to service_role;
