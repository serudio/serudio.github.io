-- Workouts: one row per set, per day, per exercise.
--
-- PRIVACY: the account's own records, like travel and goals. The policy
-- is scoped to auth.uid(), anon is granted nothing, and no row is
-- readable across accounts. Keep it that way.
--
-- Shape: a SET is the unit, not a day's "4 x 10". A real day is 10, 10,
-- 8 — a count-times-reps pair cannot hold that — and both copy features
-- ("copy this day's sets to another exercise", "do that past day again
-- today") are then one insert of duplicated rows with a single field
-- changed. It is also what makes the spreadsheet view work: a cell IS a
-- row, so editing a cell is an update, and clearing it is a delete.

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- "Pull ups" and "pull-ups" as two exercises would split a year's total
-- in half without ever looking wrong on screen.
create unique index workout_exercises_name_per_user
  on public.workout_exercises (user_id, lower(name));

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  done_on date not null,
  -- Zero is not a set that happened: clearing a cell deletes the row
  -- rather than recording that nothing was done.
  reps integer not null check (reps > 0),
  -- Which set of that day this is, and so which column it occupies.
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- One set per slot. This is what lets the grid write a cell without
-- first asking what is in it, and what stops a double-tap on a phone
-- from quietly recording the same set twice.
create unique index workout_sets_slot
  on public.workout_sets (user_id, exercise_id, done_on, sort_order);

-- The page reads a year at a time, and the totals read everything.
create index workout_sets_user_day on public.workout_sets (user_id, done_on);

/*
 * An exercise referenced by a set must belong to the same account.
 *
 * Row-level security keeps a client out of other people's rows, but a
 * foreign key is not a row it has to read: without this check, a client
 * could point one of its own sets at a stranger's exercise id and learn
 * from the error whether that id exists. SECURITY DEFINER because the
 * check has to see the row that RLS is hiding; search_path is pinned so
 * a definer function cannot be steered through the caller's own schema.
 */
create or replace function public.workout_check_exercise()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner
    from public.workout_exercises
   where id = new.exercise_id;

  if not found then
    raise exception 'workouts: exercise does not exist';
  end if;

  if v_owner <> new.user_id then
    raise exception 'workouts: exercise belongs to another account';
  end if;

  return new;
end;
$$;

create trigger workout_sets_check_exercise
  before insert or update of exercise_id, user_id on public.workout_sets
  for each row execute function public.workout_check_exercise();

/*
 * One line per year, for the years that are collapsed.
 *
 * Past years are collapsed on the page, and collapsed means not
 * fetched: three sets a day is about a thousand rows a year, so pulling
 * every year on every visit would cost more with each year of use. This
 * gives the closed lines their numbers for the price of one query, and
 * a year's detail is loaded only when it is opened.
 *
 * SECURITY INVOKER, so row-level security still applies and this cannot
 * be used to count someone else's training.
 */
create or replace function public.workout_year_totals()
returns table (year integer, reps bigint, sets bigint)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select extract(year from done_on)::integer,
         sum(reps)::bigint,
         count(*)::bigint
    from public.workout_sets
   group by 1
   order by 1 desc;
$$;

alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy workout_exercises_own on public.workout_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy workout_sets_own on public.workout_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Revoke BEFORE granting, and never assume the default: migration 0016
-- shipped a table anon could read straight through because the blanket
-- grants were already in place.
revoke all on public.workout_exercises from anon, authenticated;
revoke all on public.workout_sets from anon, authenticated;
grant select, insert, update, delete on public.workout_exercises to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;

revoke all on function public.workout_check_exercise() from public, anon;
revoke all on function public.workout_year_totals() from public, anon;
grant execute on function public.workout_year_totals() to authenticated;
