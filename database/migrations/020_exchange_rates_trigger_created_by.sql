-- Auto-fill created_by with the current authenticated user
create or replace function public.exchange_rates_set_created_by()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  if new.source is null then
    new.source := 'manual';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_exchange_rates_set_created_by on public.exchange_rates;
create trigger trg_exchange_rates_set_created_by
before insert on public.exchange_rates
for each row execute procedure public.exchange_rates_set_created_by();

-- Helpful index for queries by date
create index if not exists idx_exchange_rates_as_of_date on public.exchange_rates(as_of_date);


