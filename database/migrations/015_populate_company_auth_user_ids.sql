-- Migration to populate auth_user_id for existing companies
-- This will link companies to their auth users based on email matching

-- Create a function to populate auth_user_id for companies
CREATE OR REPLACE FUNCTION populate_company_auth_user_ids()
RETURNS void AS $$
BEGIN
  -- Update companies with auth_user_id where email matches auth.users.email
  UPDATE companies 
  SET auth_user_id = auth_users.id
  FROM auth.users
  WHERE companies.email = auth.users.email
  AND companies.auth_user_id IS NULL
  AND auth_users.email IS NOT NULL;
  
  -- Log how many companies were updated
  RAISE NOTICE 'Updated company auth_user_id from email matching';
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT populate_company_auth_user_ids();

-- Drop the function after use
DROP FUNCTION populate_company_auth_user_ids();

-- Add a comment explaining the update
COMMENT ON COLUMN companies.auth_user_id IS 'Foreign key to auth.users, populated by matching email addresses';
