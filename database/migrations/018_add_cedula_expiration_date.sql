-- Add cedula expiration date column to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS cedula_expiration_date timestamp with time zone;
