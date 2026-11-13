-- Folding a browser's counts into the account, once.
--
-- usage_record adds one click. Carrying over what a browser counted
-- before anyone signed in needs to add a whole tally at a time — and in
-- one call, because a browser with thirty remembered links should not
-- mean thirty round trips on the first signed-in page view.
--
-- WHY THIS EXISTS AT ALL: migration 0018 gave signed-in visitors their
-- own counters and the client switched stores at sign-in, discarding
-- what the browser had. The effect was that "most used" appeared for a
-- moment on load and then vanished, because the account's side was
-- empty. Carrying the counts over is the honest fix: it is the same
-- person's own history moving into their own account.

create or replace function public.usage_merge(p_entries jsonb)
returns void
language plpgsql
-- SECURITY DEFINER, like usage_record in migration 0018: the role is
-- granted SELECT on usage_counters and nothing else, so every write to
-- it goes through a function. Safe here because the row written is
-- pinned to auth.uid() below and refused outright when there is none —
-- definer rights cannot be pointed at another account's tally.
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'usage_merge: not signed in';
  end if;

  insert into public.usage_counters (user_id, scope, key, count, last_at)
  select auth.uid(),
         entry ->> 'scope',
         entry ->> 'key',
         greatest((entry ->> 'count')::integer, 0),
         coalesce((entry ->> 'last_at')::timestamptz, now())
    from jsonb_array_elements(p_entries) as entry
   where coalesce(entry ->> 'scope', '') <> ''
     and coalesce(entry ->> 'key', '') <> ''
     and (entry ->> 'count')::integer > 0
      on conflict (user_id, scope, key) do update
         -- Added, not replaced: a merge must never lose clicks the
         -- account already recorded on another device.
         set count = public.usage_counters.count + excluded.count,
             last_at = greatest(public.usage_counters.last_at, excluded.last_at);
end;
$$;

revoke all on function public.usage_merge(jsonb) from public, anon;
grant execute on function public.usage_merge(jsonb) to authenticated;
