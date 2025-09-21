-- Migration to establish relationship between employees and auth.users
-- This will add a foreign key constraint and enable proper joins

-- First, ensure the auth_user_id column exists and is properly typed
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_auth_user_id ON employees(auth_user_id);

-- Add a comment for documentation
COMMENT ON COLUMN employees.auth_user_id IS 'Foreign key reference to auth.users table for employee authentication';

-- Create a view that joins employees with auth.users for easier querying
CREATE OR REPLACE VIEW employees_with_auth AS
SELECT 
  e.*,
  au.email as auth_email
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id;

-- Add a comment for the view
COMMENT ON VIEW employees_with_auth IS 'View that joins employees with their auth user email addresses';
