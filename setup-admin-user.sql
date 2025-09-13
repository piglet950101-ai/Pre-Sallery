-- Setup admin user role
-- Run this in your Supabase SQL Editor

-- STEP 1: Find your admin user ID
SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'admin@presallery.com';

-- STEP 2: Insert the operator role for your admin user
-- Replace 'your-admin-user-id-here' with the actual ID from step 1
INSERT INTO public.user_roles (user_id, role) 
VALUES ('your-admin-user-id-here', 'operator')
ON CONFLICT (user_id) DO UPDATE SET role = 'operator';

-- STEP 3: Verify the role was set
SELECT 
  ur.user_id,
  u.email,
  ur.role,
  ur.created_at
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'operator';

-- STEP 4: Test the role system
-- This should return the admin user if everything is working
SELECT 
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@presallery.com';


