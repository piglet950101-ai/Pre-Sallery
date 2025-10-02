-- Automatically create a row in public.companies when a new auth user with role "company" signs up

-- Create helper function
create or replace function public.handle_new_company_signup()
returns trigger as $$
declare
  role text;
  company_name text;
  company_rif text;
  company_address text;
  company_phone text;
begin
  -- Read role and fields from raw_user_meta_data
  role := coalesce(new.raw_user_meta_data->>'role', '');
  if role <> 'company' then
    return new;
  end if;

  company_name := coalesce(new.raw_user_meta_data->>'company_name', '');
  company_rif := coalesce(new.raw_user_meta_data->>'company_rif', '');
  company_address := coalesce(new.raw_user_meta_data->>'company_address', '');
  company_phone := coalesce(new.raw_user_meta_data->>'company_phone', '');

  -- Insert company row if not exists
  insert into public.companies (auth_user_id, name, rif, email, address, phone, is_approved, created_at)
  select new.id, nullif(company_name, ''), nullif(company_rif, ''), new.email, nullif(company_address, ''), nullif(company_phone, ''), false, now()
  where not exists (
    select 1 from public.companies c where c.auth_user_id = new.id
  );

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created_create_company on auth.users;
create trigger on_auth_user_created_create_company
after insert on auth.users
for each row execute function public.handle_new_company_signup();


