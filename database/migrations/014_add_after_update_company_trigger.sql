-- Fire company creation function when auth.users is updated (e.g., metadata set after signup)
drop trigger if exists on_auth_user_updated_create_company on auth.users;
create trigger on_auth_user_updated_create_company
after update on auth.users
for each row execute function public.handle_new_company_signup();


