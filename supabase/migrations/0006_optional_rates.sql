-- Leaving a book's rate empty means "use the standard rate" (see rentalTerms
-- in src/data/pricing.ts), so the columns have to accept null.
alter table public.books alter column price_per_week drop not null;
alter table public.books alter column pledge drop not null;
