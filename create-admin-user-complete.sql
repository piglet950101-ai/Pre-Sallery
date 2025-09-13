-- Create admin user for operator access
-- Run this in your Supabase SQL Editor

-- Check if admin user exists
SELECT 
  id,
  email,
  raw_user_meta_data,
  app_metadata,
  created_at
FROM auth.users 
WHERE email = 'admin@presallery.com';

-- If the above query returns no results, run the following:

-- Create admin user
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
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@presallery.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Set the role in user metadata
UPDATE auth.users
SET raw_user_meta_data = '{"role": "operator"}'::jsonb
WHERE email = 'admin@presallery.com';

-- Verify the user was created correctly
SELECT 
  id,
  email,
  raw_user_meta_data,
  app_metadata,
  created_at
FROM auth.users 
WHERE email = 'admin@presallery.com';


