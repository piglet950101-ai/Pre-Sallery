-- Create admin user for Pre-Sallery
-- Replace 'admin@presallery.com' with your desired admin email
-- Replace 'admin123' with your desired password

-- Step 1: Create the user
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
  'admin@presallery.com', -- CHANGE THIS EMAIL
  crypt('admin123', gen_salt('bf')), -- CHANGE THIS PASSWORD
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- Step 2: Set the operator role
UPDATE auth.users 
SET raw_user_meta_data = '{"role": "operator"}'::jsonb
WHERE email = 'admin@presallery.com'; -- CHANGE THIS EMAIL

-- Step 3: Verify the user was created
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'admin@presallery.com'; -- CHANGE THIS EMAIL

