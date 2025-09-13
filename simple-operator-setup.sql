-- Simple operator setup without accessing auth.users table
-- Run this in your Supabase SQL Editor

-- STEP 1: Create processing_batches table
CREATE TABLE public.processing_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  total_amount numeric NOT NULL,
  total_fees numeric NOT NULL,
  advance_count integer NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT processing_batches_pkey PRIMARY KEY (id)
);

-- STEP 2: Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create simple RLS policies that allow all authenticated users
-- (We'll restrict this later once we figure out the role system)
CREATE POLICY "Processing batches: allow authenticated users" ON public.processing_batches
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 4: Enable RLS on existing tables
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create simple RLS policies for other tables
CREATE POLICY "Advance transactions: allow authenticated users" ON public.advance_transactions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Employees: allow authenticated users" ON public.employees
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Companies: allow authenticated users" ON public.companies
  FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 6: Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 7: Create trigger for updated_at on processing_batches
DROP TRIGGER IF EXISTS update_processing_batches_updated_at ON public.processing_batches;
CREATE TRIGGER update_processing_batches_updated_at
    BEFORE UPDATE ON public.processing_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON public.processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON public.processing_batches(created_at);

-- STEP 9: Verify everything was created
SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

SELECT 'Policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
AND policyname LIKE '%authenticated%';


