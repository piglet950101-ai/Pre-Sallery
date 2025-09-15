-- Complete fix for operator dashboard database issues
-- Run this in your Supabase SQL Editor

-- Step 1: Create processing_batches table
CREATE TABLE IF NOT EXISTS public.processing_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  total_fees decimal(10,2) NOT NULL,
  advance_count integer NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Step 2: Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS policies for operators to access all tables

-- Processing batches: operator can manage all
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

-- Advance transactions: operator can view all
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

-- Employees: operator can view all (for joins)
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

-- Companies: operator can view all (for joins)
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

-- Step 4: Create trigger for updated_at on processing_batches
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_processing_batches_updated_at ON public.processing_batches;
CREATE TRIGGER update_processing_batches_updated_at
    BEFORE UPDATE ON public.processing_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON public.processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON public.processing_batches(created_at);

-- Step 6: Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

-- Step 7: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
AND policyname LIKE '%operator%';



