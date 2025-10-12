-- Add soft delete functionality to employees table
-- This allows preserving employee history while marking them as deleted

-- Add deleted_at column to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Create index for better performance on soft delete queries
CREATE INDEX IF NOT EXISTS idx_employees_deleted_at ON public.employees(deleted_at);

-- Update RLS policies to handle soft delete
-- Drop existing policies
DROP POLICY IF EXISTS "Employees: company can manage own" ON public.employees;
DROP POLICY IF EXISTS "Employees: allow activation update" ON public.employees;

-- Create new policies that exclude deleted employees
CREATE POLICY "Employees: company can manage own" ON public.employees
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    ) AND deleted_at IS NULL
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Allow employees to view their own data (even if soft deleted)
CREATE POLICY "Employees: can view own data" ON public.employees
  FOR SELECT USING (
    auth_user_id = auth.uid()
  );

-- Allow activation updates (for soft deleted employees too)
CREATE POLICY "Employees: allow activation update" ON public.employees
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Create function to soft delete employee
CREATE OR REPLACE FUNCTION soft_delete_employee(employee_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.employees 
  SET deleted_at = now()
  WHERE id = employee_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore soft deleted employee
CREATE OR REPLACE FUNCTION restore_employee(employee_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.employees 
  SET deleted_at = NULL
  WHERE id = employee_id AND deleted_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
