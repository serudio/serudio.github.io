-- A person is a category, flagged.
--
-- 0011 modelled people as their own table with travel_items.person_id
-- pointing at it, so an item could be both "Hike" and someone's. In
-- practice the lists are kept the way the spreadsheet had them — a
-- column per person, beside the thematic columns — so a person is just
-- a section that happens to name someone, and wants a little different
-- treatment in the UI rather than a second dimension.
--
-- Nothing is lost dropping the old shape: no row ever had person_id
-- set, and every person already exists as a category of the same name.
alter table public.travel_categories
  add column is_person boolean not null default false;

-- Person sections are usually what you hand to someone ("here, pack
-- yours"), so they are worth finding quickly.
create index travel_categories_person_idx
  on public.travel_categories (user_id)
  where is_person;

alter table public.travel_items drop column person_id;

drop table public.travel_people;
