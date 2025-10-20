-- Fix must_change_password flag for specific employees
-- Replace 'EMPLOYEE_EMAIL_HERE' with the actual email address

-- Check current status of specific employee
SELECT 
    id,
    first_name,
    last_name,
    email,
    must_change_password,
    is_active,
    auth_user_id,
    created_at,
    updated_at
FROM employees 
WHERE email = 'EMPLOYEE_EMAIL_HERE';

-- Update specific employee to set must_change_password = false
UPDATE employees 
SET 
    must_change_password = false,
    updated_at = NOW()
WHERE email = 'EMPLOYEE_EMAIL_HERE';

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
WHERE email = 'EMPLOYEE_EMAIL_HERE';

-- Alternative: Update by employee ID instead of email
-- UPDATE employees 
-- SET 
--     must_change_password = false,
--     updated_at = NOW()
-- WHERE id = 'EMPLOYEE_ID_HERE';
