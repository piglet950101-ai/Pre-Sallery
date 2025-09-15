-- Debug script to check employee activation data
-- Run this in your Supabase SQL Editor to see what employees exist

-- Check all employees and their activation status
SELECT 
  id,
  first_name,
  last_name,
  email,
  activation_code,
  is_active,
  is_verified,
  created_at
FROM public.employees
ORDER BY created_at DESC;

-- Check if there are any employees with the specific email (replace with actual email)
-- SELECT 
--   id,
--   first_name,
--   last_name,
--   email,
--   activation_code,
--   is_active,
--   is_verified
-- FROM public.employees
-- WHERE email = 'employee@example.com';

-- Check if there are any employees with the specific activation code (replace with actual code)
-- SELECT 
--   id,
--   first_name,
--   last_name,
--   email,
--   activation_code,
--   is_active,
--   is_verified
-- FROM public.employees
-- WHERE activation_code = '123456';

-- Check RLS policies on employees table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY policyname;
