-- Complete fix for company advance approve/reject functionality
-- Run this in your Supabase SQL Editor

-- Step 1: Check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'advance_transactions' 
AND policyname LIKE '%company%';

-- Step 2: Drop existing company policies
DROP POLICY IF EXISTS "Advance transactions: company can view own" ON public.advance_transactions;
DROP POLICY IF EXISTS "Advance transactions: company can manage own" ON public.advance_transactions;

-- Step 3: Create comprehensive company policy for advance_transactions
CREATE POLICY "Advance transactions: company can manage own" ON public.advance_transactions
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Step 4: Verify the policy was created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'advance_transactions' 
AND policyname LIKE '%company%';

-- Step 5: Test the policy by checking if a company user can see their advances
-- (This will help verify the policy is working)
SELECT COUNT(*) as total_advances_for_company
FROM public.advance_transactions at
JOIN public.companies c ON at.company_id = c.id
WHERE c.auth_user_id = auth.uid();
