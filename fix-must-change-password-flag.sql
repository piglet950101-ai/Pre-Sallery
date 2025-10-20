-- Fix must_change_password flag for employees who are stuck with change password form
-- This script will set must_change_password to false for all employees

-- First, let's see which employees currently have must_change_password = true
SELECT 
    id,
    first_name,
    last_name,
    email,
    must_change_password,
    is_active,
    created_at
FROM employees 
WHERE must_change_password = true
ORDER BY created_at DESC;

-- Update all employees to set must_change_password = false
UPDATE employees 
SET 
    must_change_password = false,
    updated_at = NOW()
WHERE must_change_password = true;

-- Verify the update worked
SELECT 
    id,
    first_name,
    last_name,
    email,
    must_change_password,
    is_active,
    updated_at
FROM employees 
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;

-- Optional: If you want to reset specific employees only, use this instead:
-- UPDATE employees 
-- SET 
--     must_change_password = false,
--     updated_at = NOW()
-- WHERE email IN ('employee1@example.com', 'employee2@example.com');

-- Optional: If you want to reset only active employees:
-- UPDATE employees 
-- SET 
--     must_change_password = false,
--     updated_at = NOW()
-- WHERE must_change_password = true 
--   AND is_active = true;
