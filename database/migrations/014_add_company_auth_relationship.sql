-- Migration to establish relationship between companies and auth.users
-- This will add a foreign key constraint and enable proper joins

-- First, ensure the auth_user_id column exists and is properly typed
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_companies_auth_user_id ON companies(auth_user_id);

-- Add a comment for documentation
COMMENT ON COLUMN companies.auth_user_id IS 'Foreign key reference to auth.users table for company authentication';

-- Create a view that joins companies with auth.users for easier querying
CREATE OR REPLACE VIEW companies_with_auth AS
SELECT 
  c.*,
  au.email as auth_email
FROM companies c
LEFT JOIN auth.users au ON c.auth_user_id = au.id;

-- Add a comment for the view
COMMENT ON VIEW companies_with_auth IS 'View that joins companies with their auth user email addresses';
