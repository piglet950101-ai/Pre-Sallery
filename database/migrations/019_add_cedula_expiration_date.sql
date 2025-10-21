-- Add cedula_expiration_date column to employees table
ALTER TABLE public.employees 
ADD COLUMN cedula_expiration_date TIMESTAMPTZ;

-- Add comment to the column
COMMENT ON COLUMN public.employees.cedula_expiration_date IS 'Expiration date of the cedula document extracted via OCR';
