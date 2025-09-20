-- Migration: Remove redundant email columns
-- This migration removes email columns from companies and employees tables
-- since we'll use the auth.users.email instead

-- Remove email column from companies table
ALTER TABLE companies DROP COLUMN IF EXISTS email;

-- Remove email column from employees table  
ALTER TABLE employees DROP COLUMN IF EXISTS email;

-- Add comment explaining the change
COMMENT ON TABLE companies IS 'Company information - email is stored in auth.users table';
COMMENT ON TABLE employees IS 'Employee information - email is stored in auth.users table';
