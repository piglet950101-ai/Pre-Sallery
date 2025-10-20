-- Migration: Add must_change_password field to employees table
-- This field tracks if an employee needs to change their password on first login

-- Add must_change_password column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Add comment explaining the field
COMMENT ON COLUMN employees.must_change_password IS 'Flag indicating if employee must change password on first login';

-- Update existing employees to not require password change
UPDATE employees SET must_change_password = false WHERE must_change_password IS NULL;
