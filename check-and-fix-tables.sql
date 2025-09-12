-- Check existing tables and fix advance_transactions table
-- Run this in your Supabase SQL Editor

-- First, let's see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('companies', 'employees', 'advance_transactions');

-- Drop advance_transactions table if it exists (to recreate it properly)
DROP TABLE IF EXISTS public.advance_transactions CASCADE;

-- Create advance_transactions table with all required columns
CREATE TABLE public.advance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL references public.employees(id) on delete cascade,
  company_id uuid NOT NULL references public.companies(id) on delete cascade,
  
  -- Request details
  requested_amount decimal(10,2) NOT NULL CHECK (requested_amount >= 20),
  fee_amount decimal(10,2) NOT NULL CHECK (fee_amount >= 1),
  net_amount decimal(10,2) NOT NULL,
  
  -- Earned wages calculation
  earned_wages decimal(10,2) NOT NULL,
  available_amount decimal(10,2) NOT NULL,
  worked_days integer NOT NULL,
  total_days integer NOT NULL,
  
  -- Payment method
  payment_method text NOT NULL CHECK (payment_method IN ('pagomovil', 'bank_transfer')),
  payment_details text NOT NULL,
  
  -- Status and processing
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed')),
  batch_id text,
  processed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Advance transactions: employee can manage own" ON public.advance_transactions;
CREATE POLICY "Advance transactions: employee can manage own" ON public.advance_transactions
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Advance transactions: company can view own" ON public.advance_transactions;
CREATE POLICY "Advance transactions: company can view own" ON public.advance_transactions
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_advance_transactions_employee_id ON public.advance_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_company_id ON public.advance_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_status ON public.advance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_batch_id ON public.advance_transactions(batch_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_advance_transactions_updated_at ON public.advance_transactions;
CREATE TRIGGER update_advance_transactions_updated_at
    BEFORE UPDATE ON public.advance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created correctly
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'advance_transactions' 
AND table_schema = 'public'
ORDER BY ordinal_position;
