-- Test Role Validation Functionality
-- This script demonstrates how the role validation works

-- STEP 1: Create test users with different roles
-- (Note: In a real scenario, these would be created through the registration process)

-- Create a test employee user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'employee@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "employee"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Create a test company user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'company@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "company"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Create a test operator user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operator@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role": "operator"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- STEP 2: Add roles to user_roles table (if using the secure role system)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employee' FROM auth.users WHERE email = 'employee@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'employee';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'company' FROM auth.users WHERE email = 'company@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'company';

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'operator' FROM auth.users WHERE email = 'operator@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'operator';

-- STEP 3: Verify the test users and their roles
SELECT 
  u.email,
  u.raw_user_meta_data->>'role' as metadata_role,
  ur.role as table_role,
  CASE 
    WHEN u.raw_user_meta_data->>'role' = 'employee' THEN 'Employee Login Tab'
    WHEN u.raw_user_meta_data->>'role' = 'company' THEN 'Company Login Tab'
    WHEN u.raw_user_meta_data->>'role' = 'operator' THEN 'Admin Login Tab'
    ELSE 'Unknown Role'
  END as correct_login_tab
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('employee@test.com', 'company@test.com', 'operator@test.com')
ORDER BY u.email;

-- STEP 4: Test scenarios that should trigger role validation errors:
-- 
-- 1. Employee trying to login as Company:
--    - Email: employee@test.com
--    - Password: password123
--    - Login Tab: Company
--    - Expected: Error message "You are registered as an employee. Please use the Employee login tab."
--
-- 2. Company trying to login as Operator:
--    - Email: company@test.com
--    - Password: password123
--    - Login Tab: Admin
--    - Expected: Error message "You are registered as a company representative. Please use the Company login tab."
--
-- 3. Operator trying to login as Employee:
--    - Email: operator@test.com
--    - Password: password123
--    - Login Tab: Employee
--    - Expected: Error message "You are registered as an operator. Please use the Admin login tab."

-- STEP 5: Clean up test users (optional)
-- Uncomment the following lines to remove test users after testing:
/*
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('employee@test.com', 'company@test.com', 'operator@test.com')
);
DELETE FROM auth.users WHERE email IN ('employee@test.com', 'company@test.com', 'operator@test.com');
*/
