-- Add RLS policies for operators to access existing tables
-- Run this in your Supabase SQL Editor

-- Enable RLS on existing tables (if not already enabled)
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

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
WHERE tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
AND policyname LIKE '%operator%';


