-- Two corrections to 0014's write path.
--
-- FIRST: the grants did not say what 0014 claimed they said. Postgres
-- grants EXECUTE on a new function to PUBLIC by default, so
-- `grant execute ... to authenticated` adds nothing — the function was
-- already callable by everyone, anon included. 0014 revoked PUBLIC on
-- the owner-only functions but not on these four, so a signed-out
-- caller reached their bodies. Verified against the live database: as
-- anon, travel_share_enable answered 42501 (permission denied) while
-- travel_shared_add_item answered P0001 'sign in to edit' — the guard,
-- not the grant, was doing the work.
--
-- SECOND: the guard fired at the mercy of the query planner. In
-- set_item, delete_item and set_note the call sat in a WHERE clause:
--
--   where id = p_item_id and trip_id = travel_shared_trip_id(p_token)
--
-- An index scan that matches no row on id never evaluates the second
-- qual, so an anon call with an unknown item id returned 204 instead of
-- raising. Nothing was written — a real id forces the qual to be
-- evaluated and the guard then raises — but whether an access check
-- runs should not depend on how a row happens to be found. Each
-- function now resolves the trip before it touches a table.
--
-- Neither of these let anon write. Both made that true by accident.

/* ------------------------------------------- resolve the trip up front */

create or replace function public.travel_shared_set_item(
  p_token uuid, p_item_id uuid, p_packed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Raises before anything is touched if the token is unknown or the
  -- caller is signed out.
  v_trip uuid := public.travel_shared_trip_id(p_token);
begin
  update public.travel_items
     set packed = p_packed
   where id = p_item_id
     and trip_id = v_trip;
end;
$$;

create or replace function public.travel_shared_delete_item(p_token uuid, p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip uuid := public.travel_shared_trip_id(p_token);
begin
  delete from public.travel_items
   where id = p_item_id
     and trip_id = v_trip;
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
declare
  v_trip uuid := public.travel_shared_trip_id(p_token);
begin
  update public.travel_notes
     set done = p_done
   where id = p_note_id
     and trip_id = v_trip;
end;
$$;

/* ------------------------------------------------------- the real grants */

revoke all on function public.travel_shared_set_item(uuid, uuid, boolean) from public, anon;
revoke all on function public.travel_shared_add_item(uuid, uuid, text) from public, anon;
revoke all on function public.travel_shared_delete_item(uuid, uuid) from public, anon;
revoke all on function public.travel_shared_set_note(uuid, uuid, boolean) from public, anon;

grant execute on function public.travel_shared_set_item(uuid, uuid, boolean) to authenticated;
grant execute on function public.travel_shared_add_item(uuid, uuid, text) to authenticated;
grant execute on function public.travel_shared_delete_item(uuid, uuid) to authenticated;
grant execute on function public.travel_shared_set_note(uuid, uuid, boolean) to authenticated;

-- Reading stays open to anyone holding the link; that is the feature.
grant execute on function public.travel_shared_get(uuid) to anon, authenticated;
