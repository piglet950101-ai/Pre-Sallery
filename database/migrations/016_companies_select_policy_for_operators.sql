-- Allow authenticated users (operators/admins) to SELECT from companies
alter table public.companies enable row level security;

drop policy if exists "companies select for auth" on public.companies;
create policy "companies select for auth"
on public.companies for select
using ( auth.uid() is not null );


