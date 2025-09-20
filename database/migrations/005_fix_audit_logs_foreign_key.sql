-- Fix foreign key constraint for audit_logs to allow CASCADE DELETE
-- This will allow employees to be deleted even if audit logs exist

-- First, check if the constraint exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_employee_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_employee_id_fkey;
        RAISE NOTICE 'Dropped existing audit_logs_employee_id_fkey constraint';
    ELSE
        RAISE NOTICE 'audit_logs_employee_id_fkey constraint does not exist';
    END IF;
END $$;

-- Recreate the foreign key constraint with CASCADE DELETE
ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES employees(id) 
ON DELETE CASCADE;

-- Also fix the company_id foreign key constraint for consistency
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_company_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_company_id_fkey;
        RAISE NOTICE 'Dropped existing audit_logs_company_id_fkey constraint';
    ELSE
        RAISE NOTICE 'audit_logs_company_id_fkey constraint does not exist';
    END IF;
END $$;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_company_id_fkey 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE CASCADE;

-- Fix user_id foreign key constraint as well
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'audit_logs_user_id_fkey' 
        AND table_name = 'audit_logs'
    ) THEN
        ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_user_id_fkey;
        RAISE NOTICE 'Dropped existing audit_logs_user_id_fkey constraint';
    ELSE
        RAISE NOTICE 'audit_logs_user_id_fkey constraint does not exist';
    END IF;
END $$;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Verify the constraints were created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'audit_logs'
    AND tc.table_schema = 'public';
