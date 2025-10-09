-- Add pagomovil fields to employees table
-- This allows employees to provide pagomovil information for payouts

-- Add pagomovil fields
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS pagomovil_phone text,
  ADD COLUMN IF NOT EXISTS pagomovil_cedula text,
  ADD COLUMN IF NOT EXISTS pagomovil_bank_name text;

-- Add comments for documentation
COMMENT ON COLUMN public.employees.pagomovil_phone IS 'Phone number for pagomovil payments';
COMMENT ON COLUMN public.employees.pagomovil_cedula IS 'Cedula number for pagomovil payments';
COMMENT ON COLUMN public.employees.pagomovil_bank_name IS 'Bank name for pagomovil payments';

-- Add check constraint for account number format (20 digits for Venezuela)
ALTER TABLE public.employees
  ADD CONSTRAINT IF NOT EXISTS employees_account_number_format_check 
  CHECK (account_number ~ '^[0-9]{20}$');

-- Add check constraint for pagomovil phone format (Venezuelan phone numbers)
ALTER TABLE public.employees
  ADD CONSTRAINT IF NOT EXISTS employees_pagomovil_phone_format_check 
  CHECK (pagomovil_phone IS NULL OR pagomovil_phone ~ '^(\+58|0)[0-9]{10}$');

-- Add check constraint for pagomovil cedula format (E or V + 6-8 digits)
ALTER TABLE public.employees
  ADD CONSTRAINT IF NOT EXISTS employees_pagomovil_cedula_format_check 
  CHECK (pagomovil_cedula IS NULL OR pagomovil_cedula ~ '^[EV][0-9]{6,8}$');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_pagomovil_phone ON public.employees(pagomovil_phone);
CREATE INDEX IF NOT EXISTS idx_employees_pagomovil_cedula ON public.employees(pagomovil_cedula);
