-- Sharing a trip by link.
--
-- Anyone holding the link can read it. Anyone holding it AND signed in
-- can tick things off and add to it — which is the point: a packing
-- list is worked on by whoever is doing the packing, not only its
-- owner. Deleting the trip, renaming it, or sharing it on stays with
-- the owner.
--
-- Done with functions rather than policies because row-level security
-- can only see the signed-in user, and the thing granting access here
-- is a token in a URL. Every function below is SECURITY DEFINER, so
-- each one re-checks the token itself and resolves the trip from it —
-- a caller never names the trip, only the token and a row within it.
--
-- search_path is pinned on each: a SECURITY DEFINER function that
-- resolves names through a caller-controlled path is how these get
-- turned against the database.

alter table public.travel_trips
  add column share_token uuid unique;

-- The only lookup these functions make.
create index travel_trips_share_token_idx
  on public.travel_trips (share_token)
  where share_token is not null;

/* ------------------------------------------------------- owner controls */

create or replace function public.travel_share_enable(p_trip_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  -- Only the owner may start sharing, and a trip keeps one token so an
  -- already-sent link does not quietly stop working.
  update public.travel_trips
     set share_token = coalesce(share_token, gen_random_uuid())
   where id = p_trip_id
     and user_id = auth.uid()
  returning share_token into v_token;

  if v_token is null then
    raise exception 'not found';
  end if;

  return v_token;
end;
$$;

create or replace function public.travel_share_disable(p_trip_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  -- Clearing the token breaks every link already sent, which is the
  -- only way to take sharing back.
  update public.travel_trips
     set share_token = null
   where id = p_trip_id
     and user_id = auth.uid();
$$;

/* -------------------------------------------------------- shared access */

create or replace function public.travel_shared_get(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.travel_trips;
  v_result jsonb;
begin
  select * into v_trip from public.travel_trips where share_token = p_token;
  if v_trip.id is null then
    raise exception 'not found';
  end if;

  select jsonb_build_object(
    'trip', jsonb_build_object(
      'id', v_trip.id, 'name', v_trip.name,
      'startsOn', v_trip.starts_on, 'endsOn', v_trip.ends_on
    ),
    -- Only the categories this trip actually uses: the owner's other
    -- sections are none of a guest's business.
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'name', c.name, 'color', c.color,
        'isPerson', c.is_person, 'personId', c.person_id, 'sortOrder', c.sort_order
      ) order by c.sort_order)
      from public.travel_categories c
      where exists (
        select 1 from public.travel_items i
        where i.trip_id = v_trip.id and i.category_id = c.id
      )
    ), '[]'::jsonb),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id, 'tripId', i.trip_id, 'categoryId', i.category_id,
        'text', i.text, 'packed', i.packed, 'sortOrder', i.sort_order
      ) order by i.sort_order)
      from public.travel_items i where i.trip_id = v_trip.id
    ), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', n.id, 'tripId', n.trip_id, 'text', n.text,
        'done', n.done, 'sortOrder', n.sort_order
      ) order by n.sort_order)
      from public.travel_notes n where n.trip_id = v_trip.id
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Resolves a token to its trip, for the write functions below. Raises
-- rather than returning null so a bad token can never be mistaken for
-- "no rows matched" further down.
create or replace function public.travel_shared_trip_id(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  -- Writing needs an account. Reading does not.
  if auth.uid() is null then
    raise exception 'sign in to edit';
  end if;

  select id into v_id from public.travel_trips where share_token = p_token;
  if v_id is null then
    raise exception 'not found';
  end if;

  return v_id;
end;
$$;

create or replace function public.travel_shared_set_item(
  p_token uuid, p_item_id uuid, p_packed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- The trip comes from the token, never from the caller, so an item id
  -- from somebody else's trip simply matches nothing.
  update public.travel_items
     set packed = p_packed
   where id = p_item_id
     and trip_id = public.travel_shared_trip_id(p_token);
end;
$$;

create or replace function public.travel_shared_add_item(
  p_token uuid, p_category_id uuid, p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid := public.travel_shared_trip_id(p_token);
begin
  if coalesce(trim(p_text), '') = '' then
    return;
  end if;

  insert into public.travel_items (trip_id, category_id, text, sort_order)
  -- A guest's category must already be one this trip uses; anything
  -- else falls back to no section rather than reaching across trips.
  select v_trip,
         (select c.id from public.travel_categories c
           where c.id = p_category_id
             and exists (select 1 from public.travel_items i
                          where i.trip_id = v_trip and i.category_id = c.id)),
         trim(p_text),
         coalesce((select max(sort_order) + 1 from public.travel_items where trip_id = v_trip), 0);
end;
$$;

create or replace function public.travel_shared_delete_item(p_token uuid, p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.travel_items
   where id = p_item_id
     and trip_id = public.travel_shared_trip_id(p_token);
end;
$$;

create or replace function public.travel_shared_set_note(
  p_token uuid, p_note_id uuid, p_done boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.travel_notes
     set done = p_done
   where id = p_note_id
     and trip_id = public.travel_shared_trip_id(p_token);
end;
$$;

/* ---------------------------------------------------------------- grants */

revoke all on function public.travel_share_enable(uuid) from public, anon;
revoke all on function public.travel_share_disable(uuid) from public, anon;

grant execute on function public.travel_share_enable(uuid) to authenticated;
grant execute on function public.travel_share_disable(uuid) to authenticated;

-- Reading is the one thing a signed-out visitor may do.
grant execute on function public.travel_shared_get(uuid) to anon, authenticated;

revoke all on function public.travel_shared_trip_id(uuid) from public, anon, authenticated;
grant execute on function public.travel_shared_set_item(uuid, uuid, boolean) to authenticated;
grant execute on function public.travel_shared_add_item(uuid, uuid, text) to authenticated;
grant execute on function public.travel_shared_delete_item(uuid, uuid) to authenticated;
grant execute on function public.travel_shared_set_note(uuid, uuid, boolean) to authenticated;
