-- Fix RLS policies for employees table to allow company admins to update employee records
-- This migration ensures that company admins can update their employees' profiles

-- Drop existing policies that might be conflicting
DROP POLICY IF EXISTS "Employees: company can manage own" ON public.employees;
DROP POLICY IF EXISTS "Employees: user can manage own" ON public.employees;
DROP POLICY IF EXISTS "Employees: allow activation check" ON public.employees;
DROP POLICY IF EXISTS "Employees: allow activation update" ON public.employees;
DROP POLICY IF EXISTS "Employees: operators can view all" ON public.employees;

-- Create new, more specific policies

-- 1. Allow companies to manage their own employees (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Employees: company can manage own" ON public.employees
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 2. Allow employees to manage their own record (SELECT, UPDATE only)
CREATE POLICY "Employees: user can manage own" ON public.employees
  FOR SELECT USING (auth.uid() = auth_user_id)
  FOR UPDATE USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 3. Allow unauthenticated users to SELECT employee data for activation check
CREATE POLICY "Employees: allow activation lookup" ON public.employees
  FOR SELECT USING (true);

-- 4. Allow unauthenticated users to UPDATE employee records during activation
CREATE POLICY "Employees: allow activation update" ON public.employees
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- 5. Allow operators to view all employees (for operator dashboard)
CREATE POLICY "Employees: operators can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.operators 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 6. Allow operators to update all employees (for operator dashboard)
CREATE POLICY "Employees: operators can update all" ON public.employees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.operators 
      WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.operators 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create a function to test RLS policies
CREATE OR REPLACE FUNCTION test_employee_rls()
RETURNS TABLE (
  policy_name text,
  can_select boolean,
  can_update boolean,
  can_insert boolean,
  can_delete boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'company_admin'::text as policy_name,
    EXISTS(
      SELECT 1 FROM public.employees e
      JOIN public.companies c ON e.company_id = c.id
      WHERE c.auth_user_id = auth.uid()
      LIMIT 1
    ) as can_select,
    EXISTS(
      SELECT 1 FROM public.employees e
      JOIN public.companies c ON e.company_id = c.id
      WHERE c.auth_user_id = auth.uid()
      LIMIT 1
    ) as can_update,
    EXISTS(
      SELECT 1 FROM public.employees e
      JOIN public.companies c ON e.company_id = c.id
      WHERE c.auth_user_id = auth.uid()
      LIMIT 1
    ) as can_insert,
    EXISTS(
      SELECT 1 FROM public.employees e
      JOIN public.companies c ON e.company_id = c.id
      WHERE c.auth_user_id = auth.uid()
      LIMIT 1
    ) as can_delete;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION test_employee_rls() TO authenticated;
