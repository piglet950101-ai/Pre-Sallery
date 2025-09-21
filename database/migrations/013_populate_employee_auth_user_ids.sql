-- Migration to populate auth_user_id for existing employees
-- This will link employees to their auth users based on email matching

-- Create a function to populate auth_user_id for employees
CREATE OR REPLACE FUNCTION populate_employee_auth_user_ids()
RETURNS void AS $$
BEGIN
  -- Update employees with auth_user_id where email matches auth.users.email
  UPDATE employees 
  SET auth_user_id = auth_users.id
  FROM auth.users
  WHERE employees.email = auth_users.email
  AND employees.auth_user_id IS NULL
  AND auth_users.email IS NOT NULL;
  
  -- Log how many employees were updated
  RAISE NOTICE 'Updated employee auth_user_id from email matching';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT populate_employee_auth_user_ids();

-- Drop the function after use
DROP FUNCTION populate_employee_auth_user_ids();

-- Add a comment explaining the update
COMMENT ON COLUMN employees.auth_user_id IS 'Foreign key to auth.users, populated by matching email addresses';
