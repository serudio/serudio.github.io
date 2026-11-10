create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  original_title text,
  author text not null,
  original_author text,
  photo_url text,
  price_per_week integer not null,
  pledge integer not null,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;

-- The catalogue is public. Writes are intentionally not exposed to the client:
-- add books from the Supabase dashboard or with the service role key.
create policy "Anyone can read books"
  on public.books for select
  to anon, authenticated
  using (true);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();
