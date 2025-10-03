-- Fix company signup trigger to prevent "Database error saving new user"

-- Ensure auth_user_id is unique in companies table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'companies_auth_user_id_unique'
    ) THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;

-- Create improved helper function
CREATE OR REPLACE FUNCTION public.handle_new_company_signup()
RETURNS TRIGGER AS $$
DECLARE
  role TEXT;
  company_name TEXT;
  company_rif TEXT;
  company_address TEXT;
  company_phone TEXT;
BEGIN
  -- Read role and fields from raw_user_meta_data
  role := COALESCE(NEW.raw_user_meta_data->>'role', '');
  IF role <> 'company' THEN
    RETURN NEW;
  END IF;

  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');
  company_rif := COALESCE(NEW.raw_user_meta_data->>'company_rif', '');
  company_address := COALESCE(NEW.raw_user_meta_data->>'company_address', '');
  company_phone := COALESCE(NEW.raw_user_meta_data->>'company_phone', '');

  -- Only insert if we have basic required data
  IF company_name IS NOT NULL AND company_name != '' AND company_rif IS NOT NULL AND company_rif != '' THEN
    -- Insert company row if not exists
    INSERT INTO public.companies (auth_user_id, name, rif, email, address, phone, is_approved, created_at, rif_image_url)
    VALUES (
      NEW.id, 
      company_name, 
      company_rif, 
      NEW.email, 
      COALESCE(NULLIF(company_address, ''), 'Address'), 
      COALESCE(NULLIF(company_phone, ''), '0000000000'), 
      false, 
      NOW(),
      NULL
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth insert
    RAISE LOG 'Error in handle_new_company_signup: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers
DROP TRIGGER IF EXISTS on_auth_user_created_create_company ON auth.users;
CREATE TRIGGER on_auth_user_created_create_company
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_signup();

DROP TRIGGER IF EXISTS on_auth_user_updated_create_company ON auth.users;
CREATE TRIGGER on_auth_user_updated_create_company
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_signup();
