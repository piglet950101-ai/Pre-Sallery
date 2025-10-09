-- Fix RLS policies for companies table to allow company creation

-- Enable RLS if not already enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies are insertable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies are updatable by everyone" ON public.companies;

-- Create policies that allow company creation during signup
-- Allow anyone to insert companies (needed for signup)
CREATE POLICY "Anyone can insert companies during signup"
ON public.companies FOR INSERT
WITH CHECK (true);

-- Allow anyone to view companies
CREATE POLICY "Anyone can view companies"
ON public.companies FOR SELECT
USING (true);

-- Allow authenticated users to update their own company
CREATE POLICY "Users can update their own company"
ON public.companies FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Allow authenticated users to delete their own company
CREATE POLICY "Users can delete their own company"
ON public.companies FOR DELETE
USING (auth.uid() = auth_user_id);
