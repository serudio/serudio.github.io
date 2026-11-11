-- How often a signed-in account uses something.
--
-- Until now these counts lived in localStorage, which is per browser:
-- the shortcuts a phone learned were unknown to a laptop, and clearing
-- site data forgot them. Signed in, they follow the account instead.
-- Signed out, the local store stays exactly as it was — this does not
-- replace it, it is the other half of the same interface.
--
-- `scope` keeps unrelated counters apart: the home page's links and the
-- fuel calculator's figures are both "most used" and have nothing to
-- say to each other. One table rather than one per feature, because
-- the next thing that wants a most-used row should need no migration.

create table public.usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  scope text not null,
  key text not null,
  count integer not null default 0,
  last_at timestamptz not null default now(),
  primary key (user_id, scope, key)
);

alter table public.usage_counters enable row level security;

create policy usage_counters_own on public.usage_counters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Granting is not the same as revoking what was already there: a new
-- table in public starts with the blanket privileges anon and
-- authenticated are given, which is how 0016 ended up writable by
-- anon. Take them away first, then give back only what is used.
revoke all on public.usage_counters from anon, authenticated;
grant select on public.usage_counters to authenticated;

/* ------------------------------------------------------------ counting */

-- An increment is read-then-write, which the REST client cannot express
-- as one statement — and two statements race themselves across tabs.
create or replace function public.usage_record(p_scope text, p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'sign in to record usage';
  end if;

  -- Guards against a runaway caller filling the table with junk keys.
  if coalesce(trim(p_scope), '') = '' or coalesce(trim(p_key), '') = ''
     or length(p_scope) > 64 or length(p_key) > 128 then
    return;
  end if;

  insert into public.usage_counters (user_id, scope, key, count, last_at)
  values (auth.uid(), p_scope, p_key, 1, now())
  on conflict (user_id, scope, key) do update
    set count = public.usage_counters.count + 1,
        last_at = now();
end;
$$;

revoke all on function public.usage_record(text, text) from public, anon;
grant execute on function public.usage_record(text, text) to authenticated;
