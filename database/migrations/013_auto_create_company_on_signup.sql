-- Automatically create a row in public.companies when a new auth user with role "company" signs up

-- Ensure auth_user_id is unique in companies table
alter table public.companies add constraint if not exists companies_auth_user_id_unique unique (auth_user_id);

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

  -- Only insert if we have basic required data
  if company_name is not null and company_name != '' and company_rif is not null and company_rif != '' then
    -- Insert company row if not exists
    insert into public.companies (auth_user_id, name, rif, email, address, phone, is_approved, created_at, rif_image_url)
    values (
      new.id, 
      company_name, 
      company_rif, 
      new.email, 
      coalesce(nullif(company_address, ''), 'Address'), 
      coalesce(nullif(company_phone, ''), '0000000000'), 
      false, 
      now(),
      null
    )
    on conflict (auth_user_id) do nothing;
  end if;

  return new;
exception
  when others then
    -- Log error but don't fail the auth insert
    raise log 'Error in handle_new_company_signup: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created_create_company on auth.users;
create trigger on_auth_user_created_create_company
after insert on auth.users
for each row execute function public.handle_new_company_signup();


