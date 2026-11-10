-- Deleting a book moves it to the trash instead of dropping the row. Only the
-- admin can see trashed books; emptying the trash is a real delete.
alter table public.books add column deleted_at timestamptz;

create index books_deleted_at_idx on public.books (deleted_at);

drop policy "Anyone can read books" on public.books;

create policy "Anyone can read live books"
  on public.books for select
  to anon, authenticated
  using (deleted_at is null or public.is_admin());
