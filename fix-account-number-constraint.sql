-- Fix account number format constraint to allow cedula format
-- This allows account numbers to follow the cedula pattern: E or V followed by optional hyphen and 6-8 digits

-- First, let's see what existing data we have
-- SELECT account_number FROM public.employees WHERE account_number IS NOT NULL;

-- Drop the existing constraint
ALTER TABLE public.employees 
DROP CONSTRAINT IF EXISTS employees_account_number_format_check;

-- Add new constraint that allows both cedula format AND existing formats
-- This constraint allows:
-- 1. Cedula format: E or V followed by optional hyphen and 6-8 digits
-- 2. Numeric format: 20 digits (for existing data)
-- 3. Other valid formats: letters, numbers, hyphens (3-20 characters)
ALTER TABLE public.employees
ADD CONSTRAINT employees_account_number_format_check 
CHECK (
  account_number ~ '^[EV]-?[0-9]{6,8}$' OR  -- Cedula format
  account_number ~ '^[0-9]{20}$' OR         -- 20-digit format (existing)
  account_number ~ '^[A-Za-z0-9\-]{3,20}$'  -- Flexible format (letters, numbers, hyphens)
);

-- Add comment for documentation
COMMENT ON CONSTRAINT employees_account_number_format_check ON public.employees 
IS 'Account number allows: cedula format (E/V + 6-8 digits), 20-digit format, or flexible format (letters/numbers/hyphens, 3-20 chars)';
