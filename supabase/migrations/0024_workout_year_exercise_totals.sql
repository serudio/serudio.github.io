-- The closed line for a past year, broken down by exercise.
--
-- That line used to read "12345 reps · 678 sets". The number of sets is
-- not a figure anyone acts on, and one rep total for the whole year
-- says nothing about which training it came from. Per exercise, with
-- the biggest single set beside the total, is what the open grid's
-- header already carries — so a year reads the same whether it is open
-- or shut.
--
-- Still one query for every closed year, and still at most a handful of
-- rows each: collapsed means not fetched, for the reasons on
-- workout_year_totals in migration 0020.
--
-- SECURITY INVOKER, so row-level security still applies and this cannot
-- be used to count someone else's training.
create or replace function public.workout_year_exercise_totals()
returns table (year integer, exercise_id uuid, reps bigint, best integer)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select extract(year from done_on)::integer,
         exercise_id,
         sum(reps)::bigint,
         max(reps)::integer
    from public.workout_sets
   group by 1, 2
   order by 1 desc;
$$;

revoke all on function public.workout_year_exercise_totals() from public, anon;
grant execute on function public.workout_year_exercise_totals() to authenticated;

-- workout_year_totals() from migration 0020 is deliberately left in
-- place even though nothing calls it after this commit: the bundle
-- already live on the site still does, and dropping it here would break
-- every closed year on the page for the minutes between applying this
-- migration and the new build going out. It can be dropped by a later
-- migration once that deploy has happened.
