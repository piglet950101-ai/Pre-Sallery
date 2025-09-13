-- Fix company permissions for advance_transactions table
-- Run this in your Supabase SQL Editor

-- Drop the existing SELECT-only policy
DROP POLICY IF EXISTS "Advance transactions: company can view own" ON public.advance_transactions;

-- Create a new policy that allows companies to SELECT and UPDATE their own advances
CREATE POLICY "Advance transactions: company can manage own" ON public.advance_transactions
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'advance_transactions' 
AND policyname LIKE '%company%';
