-- Create employee_fees table to track $1 one-time registration fees per employee
-- This version uses the user_roles table for secure role checking
-- Run this in your Supabase SQL Editor AFTER creating the user_roles table

CREATE TABLE IF NOT EXISTS public.employee_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Fee information
  fee_amount decimal(10,2) NOT NULL DEFAULT 1.00, -- $1 per employee registration
  fee_type text NOT NULL DEFAULT 'employee_registration_fee',
  
  -- Status and payment
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  due_date date NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  paid_at timestamptz,
  paid_amount decimal(10,2),
  
  -- Additional information
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints - one fee per employee (one-time registration fee)
  CONSTRAINT employee_fees_unique_employee UNIQUE (company_id, employee_id)
);

-- Enable RLS on employee_fees table
ALTER TABLE public.employee_fees ENABLE ROW LEVEL SECURITY;

-- Employee fees RLS policy (companies can manage their own fees)
CREATE POLICY "Employee fees: companies can manage own" ON public.employee_fees
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Allow operators to view all employee fees (using user_roles table)
CREATE POLICY "Employee fees: operators can view all" ON public.employee_fees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'operator'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_fees_company_id ON public.employee_fees(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_fees_employee_id ON public.employee_fees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_fees_status ON public.employee_fees(status);
CREATE INDEX IF NOT EXISTS idx_employee_fees_due_date ON public.employee_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_employee_fees_created_at ON public.employee_fees(created_at);

-- Create trigger for employee_fees updated_at
DROP TRIGGER IF EXISTS update_employee_fees_updated_at ON public.employee_fees;
CREATE TRIGGER update_employee_fees_updated_at
    BEFORE UPDATE ON public.employee_fees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify table was created
SELECT 'employee_fees table created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_name = 'employee_fees';
