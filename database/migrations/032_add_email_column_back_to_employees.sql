-- Migration: Add email column back to employees table
-- This migration adds the email column back since we're storing emails directly in employees table
-- instead of relying on auth.users table

-- Add email column back to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS email text;

-- Add constraint to ensure email is unique per company
ALTER TABLE employees ADD CONSTRAINT unique_employee_email_per_company 
UNIQUE (email, company_id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);

-- Add comment explaining the change
COMMENT ON COLUMN employees.email IS 'Employee email address - stored directly in employees table for CSV imports';
