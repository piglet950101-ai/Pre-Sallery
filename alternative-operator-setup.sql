-- Alternative setup if raw_user_meta_data doesn't work
-- Run this if the main script fails

-- STEP 1: Check what metadata columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
AND column_name LIKE '%metadata%';

-- STEP 2: Create processing_batches table (same as before)
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

-- STEP 3: Enable RLS
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- STEP 4: Try alternative RLS policy using user_metadata instead
CREATE POLICY "Processing batches: operator can manage all" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role') = 'operator'
    )
  );

-- STEP 5: If that doesn't work, try a simpler approach - allow all authenticated users
-- (You can restrict this later once we figure out the correct metadata column)
-- DROP POLICY IF EXISTS "Processing batches: operator can manage all" ON public.processing_batches;
-- CREATE POLICY "Processing batches: allow authenticated users" ON public.processing_batches
--   FOR ALL USING (auth.uid() IS NOT NULL);

-- STEP 6: Create the same policies for other tables
ALTER TABLE public.advance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Try with user_metadata
CREATE POLICY "Advance transactions: operator can view all" ON public.advance_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role') = 'operator'
    )
  );

CREATE POLICY "Employees: operator can view all" ON public.employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role') = 'operator'
    )
  );

CREATE POLICY "Companies: operator can view all" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.user_metadata->>'role') = 'operator'
    )
  );

-- Verify
SELECT 'Policies created with user_metadata:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('processing_batches', 'advance_transactions', 'employees', 'companies')
AND policyname LIKE '%operator%';



