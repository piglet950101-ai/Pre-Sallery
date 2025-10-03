-- Simple fix for company signup - disable problematic trigger and use client-side creation

-- Drop the problematic triggers
DROP TRIGGER IF EXISTS on_auth_user_created_create_company ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated_create_company ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_company_signup();

-- Ensure auth_user_id is unique in companies table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'companies_auth_user_id_unique'
    ) THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_auth_user_id_unique UNIQUE (auth_user_id);
    END IF;
END $$;
