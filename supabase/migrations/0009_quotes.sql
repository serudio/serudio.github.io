-- Quotes: a random one on /quotes, a permalink per quote, admin CRUD.
--
-- LANGUAGE RULE: text_uk is Ukrainian and text_en is English. Nothing is
-- ever stored in Russian. Several seeded quotes were Russian originally
-- and were translated into Ukrainian when added; the Russian wording is
-- not kept. Mirrored in src/data/quotes.ts and in the admin form's help.
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  -- Part of a shared URL, so it is stable once published.
  slug text not null unique,
  text_uk text not null,
  text_en text,
  author text,
  -- Where it is from, when that is worth showing (a book, a play).
  source text,
  -- Category slugs. The set itself lives in src/data/quoteCategories.ts
  -- rather than a table: it is small, stable, and keeping it in code
  -- means the bilingual names come from the locale files for free.
  categories text[] not null default '{}',
  -- Unpublished quotes are drafts: admin-only, never served publicly.
  published boolean not null default true,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The public page filters by category on every load, and the permalink
-- looks a quote up by slug.
create index quotes_categories_idx on public.quotes using gin (categories);
create index quotes_slug_idx on public.quotes (slug);

alter table public.quotes enable row level security;

-- Visitors see published, untrashed quotes only. Drafts and trash never
-- leave the database for anyone but the admin — this is enforced here
-- rather than in the client, which can be bypassed.
create policy "Anyone can read published quotes"
  on public.quotes for select
  to anon, authenticated
  using (published and deleted_at is null);

-- The admin sees everything, including drafts and trash.
create policy "Admin can read all quotes"
  on public.quotes for select
  to authenticated
  using (public.is_admin());

create policy "Admin can insert quotes"
  on public.quotes for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update quotes"
  on public.quotes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete quotes"
  on public.quotes for delete
  to authenticated
  using (public.is_admin());

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- Same narrowing as 0008: visitors read, TRUNCATE goes to nobody.
revoke all on public.quotes from anon, authenticated;

grant select on public.quotes to anon;
grant select, insert, update, delete on public.quotes to authenticated;
grant all on public.quotes to service_role;
