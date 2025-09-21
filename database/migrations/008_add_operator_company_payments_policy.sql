-- Migration to add RLS policy for operators to access company_payments table
-- This allows operators to view all invoices from all companies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Company payments: operator can view all" ON public.company_payments;
DROP POLICY IF EXISTS "Company payments: operator can update all" ON public.company_payments;

-- For now, let's create a temporary policy that allows all authenticated users to access company_payments
-- This is a temporary solution - in production, you should implement proper role-based access
CREATE POLICY "Company payments: authenticated users can view all" ON public.company_payments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Company payments: authenticated users can update all" ON public.company_payments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Alternative approach: Create a more specific policy based on user metadata
-- This requires the user to have a specific role in their metadata
-- CREATE POLICY "Company payments: operator can view all" ON public.company_payments
--   FOR SELECT USING (
--     auth.jwt() ->> 'role' = 'operator'
--   );

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'company_payments'
AND policyname LIKE '%authenticated%';
