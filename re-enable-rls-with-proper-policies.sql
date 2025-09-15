-- Re-enable RLS with proper policies (run this later when you want security back)
-- Run this in your Supabase SQL Editor

-- STEP 1: Re-enable RLS on all tables
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- STEP 2: Create simple policies that don't access auth.users
-- These policies allow all authenticated users (less secure but works)
CREATE POLICY "Processing batches: allow authenticated" ON public.processing_batches
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Advance transactions: allow authenticated" ON public.advance_transactions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Employees: allow authenticated" ON public.employees
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Companies: allow authenticated" ON public.companies
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 3: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
ORDER BY tablename, policyname;

-- STEP 4: Test that RLS is working but allows access
SELECT 'Testing with RLS enabled...' as test;
SELECT COUNT(*) as total_advances FROM public.advance_transactions;



