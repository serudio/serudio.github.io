-- "100 todo": the things one account wants to get done, sized and
-- coloured by hand.
--
-- PRIVACY: like travel, goals and workouts, and unlike books and
-- quotes, this is the visitor's own list rather than something the admin
-- publishes. The policy is scoped to auth.uid(), anon is granted
-- nothing, and no row is readable across accounts. Keep it that way.
--
-- Shape: one flat table. There is no nesting, no deadline and no done
-- flag on purpose — the page is a wall of wants, and what it needs to
-- remember about each one is its words, how big it looms, and what
-- colour it is.

create table public.todo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  text text not null,
  -- How large the item is drawn, 1 to 9. A number rather than a font
  -- size: the scale that turns it into type belongs to the page, and
  -- changing that scale should not mean rewriting every row.
  weight smallint not null default 3 check (weight between 1 and 9),
  -- An index into the page's palette, NOT a hex string. The site has a
  -- light theme and a dark one, and a stored #fbbf24 would be legible
  -- in exactly one of them; an index lets each theme pick its own
  -- rendering of "amber". MUST stay in step with PALETTE in
  -- src/pages/todo/colors.ts — the constraint is the half that holds.
  color smallint not null default 0 check (color between 0 and 7),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The page reads one account's whole list at once, in display order.
create index todo_items_user on public.todo_items (user_id, sort_order, created_at);

alter table public.todo_items enable row level security;

create policy todo_items_own on public.todo_items
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Revoke BEFORE granting, and never assume the default. Supabase stopped
-- granting the Data API to new tables automatically on 2026-10-30 (see
-- migration 0008), and migration 0016 still shipped a table anon could
-- read straight through, because the blanket grants were already in
-- place. Nothing here is taken on trust.
revoke all on public.todo_items from anon, authenticated;
grant select, insert, update, delete on public.todo_items to authenticated;
