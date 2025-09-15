-- Test Permission System
-- This script demonstrates how the permission system works

-- STEP 1: Create test users with different actual roles
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
    WHEN u.raw_user_meta_data->>'role' = 'employee' THEN 'Employee Dashboard (/employee)'
    WHEN u.raw_user_meta_data->>'role' = 'company' THEN 'Company Dashboard (/company)'
    WHEN u.raw_user_meta_data->>'role' = 'operator' THEN 'Operator Dashboard (/operator)'
    ELSE 'Unknown Role'
  END as allowed_pages
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email IN ('employee@test.com', 'company@test.com', 'operator@test.com')
ORDER BY u.email;

-- STEP 4: Test scenarios that should work (no permission errors):
-- 
-- 1. Employee logs in with Employee tab → Access /employee ✅
-- 2. Company logs in with Company tab → Access /company ✅
-- 3. Operator logs in with Admin tab → Access /operator ✅
--
-- STEP 5: Test scenarios that should show permission denied errors:
--
-- 1. Employee logs in with Employee tab but tries to access /company ❌
--    Expected: "This page is only accessible to company representatives. You are currently logged in as a Employee."
--
-- 2. Employee logs in with Employee tab but tries to access /operator ❌
--    Expected: "This page is only accessible to platform operators. You are currently logged in as a Employee."
--
-- 3. Company logs in with Company tab but tries to access /employee ❌
--    Expected: "This page is only accessible to employees. You are currently logged in as a Company Representative."
--
-- 4. Company logs in with Company tab but tries to access /operator ❌
--    Expected: "This page is only accessible to platform operators. You are currently logged in as a Company Representative."
--
-- 5. Operator logs in with Admin tab but tries to access /employee ❌
--    Expected: "This page is only accessible to employees. You are currently logged in as a Platform Operator."
--
-- 6. Operator logs in with Admin tab but tries to access /company ❌
--    Expected: "This page is only accessible to company representatives. You are currently logged in as a Platform Operator."

-- STEP 6: Test cross-login scenarios (login with wrong tab but correct role):
--
-- 1. Employee logs in with Company tab → Access /employee ✅ (should work because actual role is employee)
-- 2. Company logs in with Admin tab → Access /company ✅ (should work because actual role is company)
-- 3. Operator logs in with Employee tab → Access /operator ✅ (should work because actual role is operator)

-- STEP 7: Clean up test users (optional)
-- Uncomment the following lines to remove test users after testing:
/*
DELETE FROM public.user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('employee@test.com', 'company@test.com', 'operator@test.com')
);
DELETE FROM auth.users WHERE email IN ('employee@test.com', 'company@test.com', 'operator@test.com');
*/
