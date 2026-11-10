-- Travel: packing lists per trip, per person, with pre-departure tasks.
--
-- PRIVACY: unlike books and quotes, which are written by the admin and
-- read by the world, this is each visitor's own data — packing lists
-- name family members, medication and routines. Every policy here is
-- scoped to auth.uid(); nothing is granted to anon, and no row is
-- readable across accounts. Keep it that way.
--
-- Shape: a trip owns its items and notes. The "default list" is itself a
-- trip with is_template set, so starting a new trip is copying one trip's
-- rows into another rather than a second set of tables that drift.

-- Categories and people are per account and shared across that account's
-- trips, so renaming "Toiletries" or recolouring it does not have to be
-- repeated for every trip.
create table public.travel_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  -- Hex, chosen by the owner. Null means "use the palette default for
  -- this row's position", so a category always renders with some colour.
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.travel_people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.travel_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  -- The account's reusable default list. One per account, enforced below.
  is_template boolean not null default false,
  -- Past trips stay readable but drop out of the active view.
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A second template would make "start from the default list" ambiguous.
create unique index travel_trips_one_template_per_user
  on public.travel_trips (user_id)
  where is_template;

create table public.travel_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.travel_trips (id) on delete cascade,
  category_id uuid references public.travel_categories (id) on delete set null,
  -- Whose item this is, when that matters: lets the list be filtered down
  -- to one person's bag while packing it.
  person_id uuid references public.travel_people (id) on delete set null,
  text text not null,
  packed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Things to do before leaving, not things to pack: turn off the water,
-- water the plants. They belong to the trip, not to a category.
create table public.travel_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.travel_trips (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index travel_categories_user_idx on public.travel_categories (user_id);
create index travel_people_user_idx on public.travel_people (user_id);
create index travel_trips_user_idx on public.travel_trips (user_id);
create index travel_items_trip_idx on public.travel_items (trip_id);
create index travel_notes_trip_idx on public.travel_notes (trip_id);

alter table public.travel_categories enable row level security;
alter table public.travel_people enable row level security;
alter table public.travel_trips enable row level security;
alter table public.travel_items enable row level security;
alter table public.travel_notes enable row level security;

-- Owner-only, for every verb. Written out per table rather than through a
-- helper so the policy on each one can be read without indirection.
create policy "Own travel categories"
  on public.travel_categories for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Own travel people"
  on public.travel_people for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Own travel trips"
  on public.travel_trips for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Items and notes have no user_id of their own: ownership is the trip's,
-- checked through it, so an item can never outlive or escape its trip.
create policy "Own travel items"
  on public.travel_items for all
  to authenticated
  using (
    exists (
      select 1 from public.travel_trips trip
      where trip.id = travel_items.trip_id and trip.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.travel_trips trip
      where trip.id = travel_items.trip_id and trip.user_id = auth.uid()
    )
  );

create policy "Own travel notes"
  on public.travel_notes for all
  to authenticated
  using (
    exists (
      select 1 from public.travel_trips trip
      where trip.id = travel_notes.trip_id and trip.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.travel_trips trip
      where trip.id = travel_notes.trip_id and trip.user_id = auth.uid()
    )
  );

create trigger travel_trips_set_updated_at
  before update on public.travel_trips
  for each row execute function public.set_updated_at();

-- anon gets nothing at all here: there is no public view of this data.
revoke all on public.travel_categories, public.travel_people,
  public.travel_trips, public.travel_items, public.travel_notes
  from anon, authenticated;

grant select, insert, update, delete on
  public.travel_categories, public.travel_people, public.travel_trips,
  public.travel_items, public.travel_notes
  to authenticated;

grant all on public.travel_categories, public.travel_people,
  public.travel_trips, public.travel_items, public.travel_notes
  to service_role;
