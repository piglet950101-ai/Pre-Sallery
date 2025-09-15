-- Create user_roles table for secure role management
-- Run this in your Supabase SQL Editor if you want to use the user_roles table approach

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('employee', 'company', 'operator')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_roles (users can see their own role)
CREATE POLICY "User roles: users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow operators to manage all user roles (for admin purposes)
CREATE POLICY "User roles: operators can manage all" ON public.user_roles
  FOR ALL USING (
    (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'operator' OR
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'operator'
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Verify table was created
SELECT 'user_roles table created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name = 'user_roles';