-- Fix the RLS policy for processing_batches table
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in auth.users table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%metadata%';

-- Drop the existing policy that's causing the error
DROP POLICY IF EXISTS "Processing batches: operator can manage all" ON public.processing_batches;

-- Create the correct RLS policy using only raw_user_meta_data
CREATE POLICY "Processing batches: operator can manage all" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'operator'
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'processing_batches'
AND policyname LIKE '%operator%';



