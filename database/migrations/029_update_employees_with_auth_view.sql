-- Update employees_with_auth view to include deleted_at column
-- This ensures the view includes the new soft delete functionality

-- Drop and recreate the view to include the deleted_at column
DROP VIEW IF EXISTS employees_with_auth;

CREATE OR REPLACE VIEW employees_with_auth AS
SELECT 
  e.*,
  au.email as auth_email
FROM employees e
LEFT JOIN auth.users au ON e.auth_user_id = au.id;

-- Add a comment for the view
COMMENT ON VIEW employees_with_auth IS 'View that joins employees with their auth user email addresses, includes deleted_at for soft delete functionality';
