-- Fix RLS policies for operator access to advance_transactions and processing_batches
-- Run this in your Supabase SQL Editor

-- Add RLS policy for operators to access all advance_transactions
DROP POLICY IF EXISTS "Advance transactions: operator can view all" ON public.advance_transactions;
CREATE POLICY "Advance transactions: operator can view all" ON public.advance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data->>'role') = 'operator' 
        OR (auth.users.app_metadata->>'role') = 'operator'
      )
    )
  );

-- Add RLS policy for operators to access all processing_batches
DROP POLICY IF EXISTS "Processing batches: operator can manage all" ON public.processing_batches;
CREATE POLICY "Processing batches: operator can manage all" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data->>'role') = 'operator' 
        OR (auth.users.app_metadata->>'role') = 'operator'
      )
    )
  );

-- Add RLS policy for operators to access all employees (for joins)
DROP POLICY IF EXISTS "Employees: operator can view all" ON public.employees;
CREATE POLICY "Employees: operator can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data->>'role') = 'operator' 
        OR (auth.users.app_metadata->>'role') = 'operator'
      )
    )
  );

-- Add RLS policy for operators to access all companies (for joins)
DROP POLICY IF EXISTS "Companies: operator can view all" ON public.companies;
CREATE POLICY "Companies: operator can view all" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data->>'role') = 'operator' 
        OR (auth.users.app_metadata->>'role') = 'operator'
      )
    )
  );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('advance_transactions', 'processing_batches', 'employees', 'companies')
AND policyname LIKE '%operator%';


