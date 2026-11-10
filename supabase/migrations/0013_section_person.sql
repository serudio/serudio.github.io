-- Whose section this is.
--
-- 0012 made a person a flagged category. This lets an ordinary section
-- belong to one of them: "Toiletries" can be Sofi's without stopping
-- being Toiletries, which a flat list of sections could not express —
-- the spreadsheet had to choose between a column per person and a
-- column per kind of thing.
--
-- Self-referencing, because a person is a category. Nothing stops a
-- person section being assigned to another person; there is no sensible
-- reason to and no harm if it happens, so it is not worth a constraint
-- that would need maintaining.
alter table public.travel_categories
  add column person_id uuid references public.travel_categories (id) on delete set null;

-- The person filter asks this question of every section on the page.
create index travel_categories_person_fk_idx
  on public.travel_categories (person_id)
  where person_id is not null;
