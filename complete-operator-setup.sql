-- Complete setup for operator dashboard - run this step by step
-- Run this in your Supabase SQL Editor

-- STEP 1: Check what metadata columns exist in auth.users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%metadata%';

-- STEP 2: Create the processing_batches table
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

-- STEP 3: Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create the update_updated_at_column function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 5: Create trigger for updated_at on processing_batches
DROP TRIGGER IF EXISTS update_processing_batches_updated_at ON public.processing_batches;
CREATE TRIGGER update_processing_batches_updated_at
    BEFORE UPDATE ON public.processing_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON public.processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON public.processing_batches(created_at);

-- STEP 7: Create RLS policy for operators (using raw_user_meta_data)
CREATE POLICY "Processing batches: operator can manage all" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'operator'
    )
  );

-- STEP 8: Add RLS policies for operators to access other tables
-- Enable RLS on existing tables (if not already enabled)
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing operator policies (if they exist)
DROP POLICY IF EXISTS "Advance transactions: operator can view all" ON public.advance_transactions;
DROP POLICY IF EXISTS "Employees: operator can view all" ON public.employees;
DROP POLICY IF EXISTS "Companies: operator can view all" ON public.companies;

-- Create operator policies for advance_transactions
CREATE POLICY "Advance transactions: operator can view all" ON public.advance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'operator'
    )
  );

-- Create operator policies for employees
CREATE POLICY "Employees: operator can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'operator'
    )
  );

-- Create operator policies for companies
CREATE POLICY "Companies: operator can view all" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.raw_user_meta_data->>'role') = 'operator'
    )
  );

-- STEP 9: Verify everything was created correctly
SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('processing_batches', 'advance_transactions', 'employees', 'companies');

SELECT 'Policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
AND policyname LIKE '%operator%';



