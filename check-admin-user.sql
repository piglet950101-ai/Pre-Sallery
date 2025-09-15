-- Check if admin user exists and has correct role
-- Run this in your Supabase SQL Editor

-- Check if admin user exists in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  app_metadata,
  created_at
FROM auth.users 
WHERE email = 'admin@presallery.com';

-- If the user doesn't exist, create it
-- Uncomment and run this if needed:
/*
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
*/




