-- Goals with deadlines, nested up to ten levels.
--
-- PRIVACY: like travel, and unlike books and quotes, this is each
-- visitor's own data rather than something the admin writes for the
-- world to read. The policy is scoped to auth.uid(), anon is granted
-- nothing, and no row is readable across accounts. Keep it that way.
--
-- Shape: ONE table, self-referencing. A step is a goal — same columns,
-- same policy, same queries — so splitting a goal into smaller ones with
-- their own deadlines needs no second table. A separate goal_steps would
-- mean a second policy and a second set of grants saying the same thing,
-- which is precisely where migration 0016 went wrong.

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Null for a goal in its own right; set for a step of another one.
  -- Cascading means deleting a goal takes everything beneath it.
  parent_id uuid references public.goals (id) on delete cascade,
  title text not null,
  -- A day, not a moment: "by the 14th", not "by 14:30".
  due_on date,
  -- WHEN it was finished, not whether. "Three weeks after the deadline"
  -- is worth being able to see later, and the timestamp costs nothing
  -- that a boolean would have saved.
  done_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The page reads one account's whole tree at once and assembles it in
-- the browser, so this is the only access path that matters.
create index goals_user_parent on public.goals (user_id, parent_id, sort_order);

/*
 * Depth, ownership and cycles, enforced here rather than in the client.
 *
 * Guards in the app are UX: this is a client-side site, and anyone can
 * call the API directly (see CLAUDE.md, "Auth and Supabase"). An
 * unbounded chain is also what would turn the page's own traversal into
 * a hang, so the limit has to hold at the only place that cannot be
 * edited out.
 *
 * SECURITY DEFINER because the walk has to see the ancestors to judge
 * them, and row-level security would hide exactly the rows that make a
 * cross-account parent worth rejecting. search_path is pinned for the
 * usual reason: a definer function must not resolve names through
 * whatever the caller put in front of them.
 */
create or replace function public.goals_check_parent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent uuid := new.parent_id;
  v_owner uuid;
  v_depth integer := 1;
begin
  if v_parent is null then
    return new;
  end if;

  while v_parent is not null loop
    -- Walking back into the row being written means the chain loops.
    -- Nothing creates one today — a step's parent is fixed when it is
    -- created — but an UPDATE that re-parents a goal under its own
    -- descendant would, and an unbounded walk would then spin here
    -- rather than fail.
    if v_parent = new.id then
      raise exception 'goals: a goal cannot be nested under itself';
    end if;

    select user_id, parent_id into v_owner, v_parent
      from public.goals
     where id = v_parent;

    if not found then
      raise exception 'goals: parent does not exist';
    end if;

    -- Checked by hand because this function bypasses row-level
    -- security. RLS hides another account's row, but hiding it does not
    -- stop a foreign key pointing at it: without this, a client could
    -- hang its own goal off a stranger's id and learn that the id
    -- exists.
    if v_owner <> new.user_id then
      raise exception 'goals: parent belongs to another account';
    end if;

    v_depth := v_depth + 1;
    if v_depth > 10 then
      raise exception 'goals: nesting deeper than 10 levels';
    end if;
  end loop;

  return new;
end;
$$;

create trigger goals_check_parent_trigger
  before insert or update of parent_id, user_id on public.goals
  for each row execute function public.goals_check_parent();

alter table public.goals enable row level security;

create policy goals_own on public.goals
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Revoke BEFORE granting, and never assume the default. Supabase stopped
-- granting the Data API to new tables automatically on 2026-10-30 (see
-- migration 0008), and migration 0016 still shipped a table anon could
-- read straight through, because the blanket grants were already in
-- place. Nothing here is taken on trust.
revoke all on public.goals from anon, authenticated;
grant select, insert, update, delete on public.goals to authenticated;

-- A trigger function is not called by the client, so no one needs
-- EXECUTE on it; new functions grant it to PUBLIC regardless.
revoke all on function public.goals_check_parent() from public, anon;
