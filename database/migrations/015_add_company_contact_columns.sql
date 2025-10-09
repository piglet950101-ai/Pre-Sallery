-- Add commonly used contact fields to companies table to match API usage
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text;


