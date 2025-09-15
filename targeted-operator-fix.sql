-- Targeted fix for operator access - only disable RLS on specific tables
-- Run this in your Supabase SQL Editor

-- STEP 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

-- STEP 2: Drop all existing policies that might be causing issues
DROP POLICY IF EXISTS "Processing batches: operator can manage all" ON public.processing_batches;
DROP POLICY IF EXISTS "Processing batches: allow authenticated users" ON public.processing_batches;
DROP POLICY IF EXISTS "Advance transactions: operator can view all" ON public.advance_transactions;
DROP POLICY IF EXISTS "Employees: operator can view all" ON public.employees;
DROP POLICY IF EXISTS "Companies: operator can view all" ON public.companies;

-- STEP 3: Disable RLS only on tables that the operator needs to access
ALTER TABLE public.processing_batches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- STEP 4: Verify the changes
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

-- STEP 5: Test access
SELECT 'Testing access to advance_transactions...' as test;
SELECT COUNT(*) as total_advances FROM public.advance_transactions;

SELECT 'Testing access to employees...' as test;
SELECT COUNT(*) as total_employees FROM public.employees;

SELECT 'Testing access to companies...' as test;
SELECT COUNT(*) as total_companies FROM public.companies;




