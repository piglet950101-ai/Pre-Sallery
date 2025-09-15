-- Fix RLS policies for employee activation
-- Run this in your Supabase SQL Editor

-- First, drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Employees: company can manage own" ON public.employees;
DROP POLICY IF EXISTS "Employees: user can manage own" ON public.employees;
DROP POLICY IF EXISTS "Employees: allow activation check" ON public.employees;
DROP POLICY IF EXISTS "Employees: allow activation update" ON public.employees;

-- Create new, cleaner policies

-- 1. Allow companies to manage their own employees (when authenticated)
CREATE POLICY "Employees: company can manage own" ON public.employees
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- 2. Allow employees to manage their own record (when authenticated)
CREATE POLICY "Employees: user can manage own" ON public.employees
  FOR ALL USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 3. Allow unauthenticated users to SELECT employee data for activation check
-- This is needed for the initial lookup during registration
CREATE POLICY "Employees: allow activation lookup" ON public.employees
  FOR SELECT USING (true);

-- 4. Allow unauthenticated users to UPDATE employee records during activation
-- This is needed to set auth_user_id and is_active when the user signs up
CREATE POLICY "Employees: allow activation update" ON public.employees
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- 5. Allow operators to view all employees (for operator dashboard)
CREATE POLICY "Employees: operators can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'operator'
    )
  );

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY policyname;
