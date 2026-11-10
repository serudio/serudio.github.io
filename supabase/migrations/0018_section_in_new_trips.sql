-- Which sections a new trip starts with.
--
-- A new trip is copied from the default list, which until now meant all
-- of it. But the default list is also where a section like "Snowboard"
-- lives: worth keeping, worth having one click away, and wrong on the
-- other eleven trips of the year. Deleting it from each trip afterwards
-- is the sort of chore the list exists to remove.
--
-- So a section says whether it travels. The flag sits on the category
-- rather than on the default list's items because a section is one
-- thing account-wide; it changes nothing about trips that already
-- exist, only what the next one is seeded with.
--
-- Default true: every section already in use was being copied, and the
-- new column must not quietly empty anyone's next trip.
alter table public.travel_categories
  add column in_new_trips boolean not null default true;
