-- Exchange rates table and policies
create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  as_of_date date not null,
  usd_to_ves numeric(18,6) not null check (usd_to_ves > 0),
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(as_of_date)
);

alter table public.exchange_rates enable row level security;

-- Allow anyone to read the current and historical rates
drop policy if exists "exchange_rates_select_all" on public.exchange_rates;
create policy "exchange_rates_select_all" on public.exchange_rates
for select to anon, authenticated
using (true);

-- Allow authenticated users to insert/update; UI will gate to operators
drop policy if exists "exchange_rates_write_authenticated" on public.exchange_rates;
create policy "exchange_rates_write_authenticated" on public.exchange_rates
for insert to authenticated with check (true);

drop policy if exists "exchange_rates_update_authenticated" on public.exchange_rates;
create policy "exchange_rates_update_authenticated" on public.exchange_rates
for update to authenticated using (true) with check (true);

-- Helper view: latest rate
create or replace view public.exchange_rate_latest as
select as_of_date, usd_to_ves, source, created_at
from public.exchange_rates
order by as_of_date desc, created_at desc
limit 1;


