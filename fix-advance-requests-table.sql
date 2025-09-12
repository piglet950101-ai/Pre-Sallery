-- Fix advance_requests table if it doesn't exist or is missing columns
-- Run this in your Supabase SQL Editor

-- Drop and recreate the advance_requests table to ensure all columns exist
DROP TABLE IF EXISTS public.advance_requests CASCADE;

-- Create advance_requests table with all required columns
CREATE TABLE public.advance_requests (
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
  payment_details text NOT NULL, -- phone number or account number
  
  -- Status and processing
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed')),
  batch_id text,
  processed_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on advance_requests table
ALTER TABLE public.advance_requests ENABLE ROW LEVEL SECURITY;

-- Advance requests RLS policies
DROP POLICY IF EXISTS "Advance requests: employee can manage own" ON public.advance_requests;
CREATE POLICY "Advance requests: employee can manage own" ON public.advance_requests
  FOR ALL USING (
    employee_id IN (
      SELECT id FROM public.employees 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Advance requests: company can view own" ON public.advance_requests;
CREATE POLICY "Advance requests: company can view own" ON public.advance_requests
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create indexes for advance_requests
CREATE INDEX IF NOT EXISTS idx_advance_requests_employee_id ON public.advance_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_company_id ON public.advance_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_advance_requests_status ON public.advance_requests(status);
CREATE INDEX IF NOT EXISTS idx_advance_requests_batch_id ON public.advance_requests(batch_id);

-- Create trigger for advance_requests updated_at
DROP TRIGGER IF EXISTS update_advance_requests_updated_at ON public.advance_requests;
CREATE TRIGGER update_advance_requests_updated_at
    BEFORE UPDATE ON public.advance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
