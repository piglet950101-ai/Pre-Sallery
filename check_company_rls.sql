-- Check RLS policies for companies table

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'companies';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'companies';

-- Check if we can insert into companies table (this will show any constraint issues)
-- Note: This is just a test query, won't actually insert
SELECT 'companies table structure check' as test;
