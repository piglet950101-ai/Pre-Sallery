-- Add cedula_expiration_date column to employees table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS cedula_expiration_date TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN public.employees.cedula_expiration_date IS 'Expiration date of the cedula document extracted via OCR';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employees' 
AND column_name = 'cedula_expiration_date';
