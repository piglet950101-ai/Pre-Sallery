-- Check existing status values in advance_transactions table
-- Run this first to see what status values exist before running the migration

SELECT 
    status,
    count(*) as count,
    min(created_at) as first_occurrence,
    max(created_at) as last_occurrence
FROM public.advance_transactions 
GROUP BY status
ORDER BY count DESC, status;

-- Also check if the constraint already exists
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.advance_transactions'::regclass 
    AND contype = 'c' 
    AND conname LIKE '%status%';
