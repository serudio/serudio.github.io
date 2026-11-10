-- Only the owner may change the catalogue. The check runs in Postgres against
-- the signed Supabase JWT, so it holds no matter what the browser sends.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'cestserg@gmail.com'
     and coalesce((auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean, false);
$$;

create policy "Admin can insert books"
  on public.books for insert
  to authenticated
  with check (public.is_admin());

create policy "Admin can update books"
  on public.books for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admin can delete books"
  on public.books for delete
  to authenticated
  using (public.is_admin());
