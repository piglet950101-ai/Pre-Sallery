-- Migration to populate employee emails from auth.users table
-- This will update existing employees with their email addresses from auth.users

-- Create a function to update employee emails from auth.users
CREATE OR REPLACE FUNCTION populate_employee_emails()
RETURNS void AS $$
BEGIN
  -- Update employees with emails from auth.users where auth_user_id matches
  UPDATE employees 
  SET email = auth_users.email
  FROM auth.users
  WHERE employees.auth_user_id = auth.users.id
  AND employees.email IS NULL
  AND auth_users.email IS NOT NULL;
  
  -- Log how many employees were updated
  RAISE NOTICE 'Updated employee emails from auth.users';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT populate_employee_emails();

-- Drop the function after use
DROP FUNCTION populate_employee_emails();

-- Add a comment explaining the update
COMMENT ON COLUMN employees.email IS 'Employee email address, populated from auth.users when available';
