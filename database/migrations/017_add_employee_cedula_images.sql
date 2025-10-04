-- Add Cédula image URL columns to employees table
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS cedula_front_url text,
  ADD COLUMN IF NOT EXISTS cedula_back_url text;


