-- Crossing something off the "100 todo" wall.
--
-- WHEN it was done, not whether. "Three years after I wrote it down" is
-- worth being able to see later, and the timestamp costs nothing a
-- boolean would have saved — the same choice goals.done_at made in
-- migration 0019.
--
-- Done items stay on the wall. A list of things you wanted to do is
-- also a record of the ones you did, and deleting them on completion
-- would throw that half away.

alter table public.todo_items add column done_at timestamptz;

-- No grants or policies to add: a column inherits the table's, and
-- todo_items is already scoped to auth.uid() with anon granted nothing
-- (migration 0022). Adding them again here would be two places saying
-- the same thing, which is how migration 0016 went wrong.
