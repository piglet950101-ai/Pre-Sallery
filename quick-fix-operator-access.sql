-- Quick fix for operator access - disable RLS temporarily
-- Run this in your Supabase SQL Editor

-- STEP 1: Disable RLS on all tables temporarily
ALTER TABLE public.processing_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- STEP 2: Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

-- STEP 3: Test if you can now access the data
-- This should work without permission errors
SELECT COUNT(*) as advance_count FROM public.advance_transactions;
SELECT COUNT(*) as employee_count FROM public.employees;
SELECT COUNT(*) as company_count FROM public.companies;



