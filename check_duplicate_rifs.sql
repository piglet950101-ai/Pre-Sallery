-- Check for duplicate RIFs in companies table

-- Check if there's a unique constraint on rif
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'companies' 
    AND tc.constraint_type = 'UNIQUE'
    AND kcu.column_name = 'rif';

-- Check for duplicate RIFs
SELECT rif, COUNT(*) as count
FROM public.companies 
GROUP BY rif 
HAVING COUNT(*) > 1;

-- Show all companies with their RIFs
SELECT id, name, rif, email, created_at
FROM public.companies 
ORDER BY rif, created_at;

-- Optional: Remove duplicate RIFs (keep the oldest one)
-- WARNING: This will delete duplicate records!
-- DELETE FROM public.companies 
-- WHERE id NOT IN (
--     SELECT MIN(id) 
--     FROM public.companies 
--     GROUP BY rif
-- );
