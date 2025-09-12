-- Step-by-step database setup to fix all issues
-- Run each section one by one in your Supabase SQL Editor

-- STEP 1: Check what tables currently exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- STEP 2: Create companies table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rif text UNIQUE NOT NULL,
  address text,
  phone text,
  email text,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 3: Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create companies RLS policy
DROP POLICY IF EXISTS "Companies: user can manage own" ON public.companies;
CREATE POLICY "Companies: user can manage own" ON public.companies
  FOR ALL USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- STEP 5: Create employees table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  company_id uuid NOT NULL references public.companies(id) on delete cascade,
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  cedula text,
  birth_date date,
  year_of_employment integer NOT NULL,
  
  -- Employment Information
  position text NOT NULL,
  department text,
  employment_start_date date NOT NULL,
  employment_type text NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
  weekly_hours integer NOT NULL CHECK (weekly_hours > 0 AND weekly_hours <= 80),
  monthly_salary decimal(10,2) NOT NULL CHECK (monthly_salary > 0),
  
  -- Financial Information
  living_expenses decimal(10,2) NOT NULL CHECK (living_expenses >= 0),
  dependents integer NOT NULL CHECK (dependents >= 0),
  emergency_contact text NOT NULL,
  emergency_phone text NOT NULL,
  
  -- Address Information
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text,
  
  -- Banking Information
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('savings', 'checking')),
  
  -- Additional Information
  notes text,
  
  -- Activation and Status
  activation_code text NOT NULL,
  is_active boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  verification_date timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- STEP 6: Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create employees RLS policies
DROP POLICY IF EXISTS "Employees: company can manage own" ON public.employees;
CREATE POLICY "Employees: company can manage own" ON public.employees
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.companies 
      WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Employees: user can manage own" ON public.employees;
CREATE POLICY "Employees: user can manage own" ON public.employees
  FOR ALL USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Allow unauthenticated users to read employee data for activation
DROP POLICY IF EXISTS "Employees: allow activation check" ON public.employees;
CREATE POLICY "Employees: allow activation check" ON public.employees
  FOR SELECT USING (true);

-- Allow unauthenticated users to update employee records during activation
DROP POLICY IF EXISTS "Employees: allow activation update" ON public.employees;
CREATE POLICY "Employees: allow activation update" ON public.employees
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- STEP 8: Drop advance_transactions table if it exists (to recreate it properly)
DROP TABLE IF EXISTS public.advance_transactions CASCADE;

-- STEP 9: Create advance_transactions table
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

-- STEP 10: Enable RLS on advance_transactions
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 11: Create advance_transactions RLS policies
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

-- STEP 12: Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_activation_code ON public.employees(activation_code);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

CREATE INDEX IF NOT EXISTS idx_advance_transactions_employee_id ON public.advance_transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_company_id ON public.advance_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_status ON public.advance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_batch_id ON public.advance_transactions(batch_id);

-- STEP 13: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 14: Create triggers
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advance_transactions_updated_at ON public.advance_transactions;
CREATE TRIGGER update_advance_transactions_updated_at
    BEFORE UPDATE ON public.advance_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 15: Verify all tables were created correctly
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('companies', 'employees', 'advance_transactions')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
