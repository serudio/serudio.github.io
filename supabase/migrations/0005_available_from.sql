-- When a book is rented out, the date it is expected back.
alter table public.books add column available_from date;
