-- Secure operator setup using custom role system
-- Run this in your Supabase SQL Editor

-- STEP 1: Create a user_roles table to track user roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('employee', 'company', 'operator')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_unique UNIQUE (user_id)
);

-- STEP 2: Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create RLS policy for user_roles (users can see their own role)
CREATE POLICY "User roles: users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- STEP 4: Create processing_batches table
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

-- STEP 5: Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- STEP 6: Create RLS policy for processing_batches (only operators can access)
CREATE POLICY "Processing batches: operators only" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'operator'
    )
  );

-- STEP 7: Update existing RLS policies to use the new role system
-- Drop existing policies
DROP POLICY IF EXISTS "Advance transactions: employee can manage own" ON public.advance_transactions;
DROP POLICY IF EXISTS "Advance transactions: company can view own" ON public.advance_transactions;
DROP POLICY IF EXISTS "Employees: company can manage own" ON public.employees;
DROP POLICY IF EXISTS "Companies: company can manage own" ON public.companies;

-- Create new policies using the role system
CREATE POLICY "Advance transactions: employees can manage own" ON public.advance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'employee'
      AND advance_transactions.employee_id IN (
        SELECT id FROM public.employees WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Advance transactions: companies can view own" ON public.advance_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'company'
      AND advance_transactions.company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Advance transactions: operators can view all" ON public.advance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'operator'
    )
  );

-- Similar policies for employees and companies tables
CREATE POLICY "Employees: companies can manage own" ON public.employees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'company'
      AND employees.company_id IN (
        SELECT id FROM public.companies WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Employees: operators can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'operator'
    )
  );

CREATE POLICY "Companies: companies can manage own" ON public.companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'company'
      AND companies.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Companies: operators can view all" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'operator'
    )
  );

-- STEP 8: Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 9: Create trigger for updated_at on processing_batches
DROP TRIGGER IF EXISTS update_processing_batches_updated_at ON public.processing_batches;
CREATE TRIGGER update_processing_batches_updated_at
    BEFORE UPDATE ON public.processing_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 10: Create indexes
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON public.processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON public.processing_batches(created_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- STEP 11: Insert operator role for admin user (replace with your admin user ID)
-- You'll need to get the user ID from auth.users first
-- INSERT INTO public.user_roles (user_id, role) 
-- VALUES ('your-admin-user-id-here', 'operator');

-- STEP 12: Verify everything was created
SELECT 'Tables created:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('processing_batches', 'user_roles', 'advance_transactions', 'employees', 'companies');

SELECT 'Policies created:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('processing_batches', 'user_roles', 'advance_transactions', 'employees', 'companies')
ORDER BY tablename, policyname;



