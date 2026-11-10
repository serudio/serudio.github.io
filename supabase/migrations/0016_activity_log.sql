-- What changed on a trip, and when.
--
-- Written by triggers rather than by the app. The client already has
-- four places that add an item (typing one, a recommended set, "from
-- default", a preset) and more that delete; a log the app has to
-- remember to write is a log that is wrong the first time somebody adds
-- a fifth. Triggers also catch edits made through a share link, which
-- is the case where "who changed this" is an actual question rather
-- than a curiosity.
--
-- Scope is items and tasks: the content of a list. Sections live in
-- travel_categories, which is account-wide rather than per-trip — a
-- rename there touches every trip at once and does not belong to any
-- one of their logs.
--
-- Ticking is deliberately not logged. It is far and away the most
-- frequent action, the result is already on screen as a checkbox, and
-- one packing session would bury every structural change under fifty
-- rows of noise.

create table public.travel_activity (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.travel_trips (id) on delete cascade,
  -- The trip's owner, copied here so row-level security can answer
  -- without joining back to the trip on every read.
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Who did it. Null when a trigger fired outside a request, and not
  -- the same as user_id when somebody edits through a share link.
  actor_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in (
    'item.added', 'item.removed', 'item.renamed',
    'note.added', 'note.removed', 'note.renamed'
  )),
  /** The item or task the entry is about, as it read at the time. */
  subject text not null,
  /** The section for an item, or the previous wording for a rename. */
  detail text,
  created_at timestamptz not null default now()
);

-- Every read is "this trip, newest first".
create index travel_activity_trip_idx
  on public.travel_activity (trip_id, created_at desc);

alter table public.travel_activity enable row level security;

-- Reading only, and only your own. Nothing may write from a client:
-- the rows come from the triggers below, which run as the owner.
create policy travel_activity_select on public.travel_activity
  for select using (user_id = auth.uid());

grant select on public.travel_activity to authenticated;

/* --------------------------------------------------------- the writer */

create or replace function public.travel_log(
  p_trip_id uuid, p_kind text, p_subject text, p_detail text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.travel_trips where id = p_trip_id;
  -- No trip means the row is on its way out with it; nothing to log.
  if v_owner is null then
    return;
  end if;

  insert into public.travel_activity (trip_id, user_id, actor_id, kind, subject, detail)
  values (p_trip_id, v_owner, auth.uid(), p_kind, p_subject, p_detail);
end;
$$;

revoke all on function public.travel_log(uuid, text, text, text) from public, anon, authenticated;

/* -------------------------------------------------------------- items */

create or replace function public.travel_items_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_section text;
begin
  if tg_op = 'INSERT' then
    select name into v_section from public.travel_categories where id = new.category_id;
    perform public.travel_log(new.trip_id, 'item.added', new.text, v_section);
    return new;
  end if;

  if tg_op = 'DELETE' then
    select name into v_section from public.travel_categories where id = old.category_id;
    perform public.travel_log(old.trip_id, 'item.removed', old.text, v_section);
    return old;
  end if;

  -- Only the wording. A tick is an update too, and is not logged.
  if new.text is distinct from old.text then
    perform public.travel_log(new.trip_id, 'item.renamed', new.text, old.text);
  end if;
  return new;
end;
$$;

create trigger travel_items_log
  after insert or update or delete on public.travel_items
  for each row execute function public.travel_items_log();

/* -------------------------------------------------------------- tasks */

create or replace function public.travel_notes_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.travel_log(new.trip_id, 'note.added', new.text, null);
    return new;
  end if;

  if tg_op = 'DELETE' then
    perform public.travel_log(old.trip_id, 'note.removed', old.text, null);
    return old;
  end if;

  if new.text is distinct from old.text then
    perform public.travel_log(new.trip_id, 'note.renamed', new.text, old.text);
  end if;
  return new;
end;
$$;

create trigger travel_notes_log
  after insert or update or delete on public.travel_notes
  for each row execute function public.travel_notes_log();
