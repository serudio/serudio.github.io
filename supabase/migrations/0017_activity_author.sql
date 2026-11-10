-- Who made the change, and the grants 0016 should have had.
--
-- GRANTS FIRST. 0016 said "grant select to authenticated" and left it
-- there, so the table kept the blanket privileges Supabase hands new
-- tables in public: anon and authenticated both held INSERT, UPDATE,
-- DELETE and TRUNCATE on it. Checked against the live database — every
-- other travel table is correctly scoped, this one alone was not.
--
-- Nothing could actually be written: the only policy is for select, so
-- row-level security refused the rest (verified as anon: 42501). But
-- that left RLS carrying it alone, which is the same mistake 0015 had
-- to come back and fix on the share functions. A grant that says what
-- it means is the point.
--
-- THEN THE AUTHOR. A shared trip is edited by whoever is doing the
-- packing, so "added шкарпетки" is only half an answer. The name is
-- copied onto the row at write time rather than joined later: auth.users
-- is not readable from a client, and a log is a record of what was true
-- then — a collaborator who later changes their name should not
-- silently rewrite history.

revoke all on public.travel_activity from anon, authenticated;
grant select on public.travel_activity to authenticated;

alter table public.travel_activity
  add column actor_label text;

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
  v_label text;
begin
  select user_id into v_owner from public.travel_trips where id = p_trip_id;
  -- No trip means the row is on its way out with it; nothing to log.
  if v_owner is null then
    return;
  end if;

  -- Google gives a name; fall back to the address, and to nothing at
  -- all when a trigger fires outside a request.
  v_label := coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''),
    nullif(auth.jwt() ->> 'email', '')
  );

  insert into public.travel_activity
    (trip_id, user_id, actor_id, actor_label, kind, subject, detail)
  values
    (p_trip_id, v_owner, auth.uid(), v_label, p_kind, p_subject, p_detail);
end;
$$;

revoke all on function public.travel_log(uuid, text, text, text) from public, anon, authenticated;
