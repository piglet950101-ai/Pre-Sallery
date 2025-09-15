-- Create processing_batches table if it doesn't exist
-- Run this in your Supabase SQL Editor

-- Check if processing_batches table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'processing_batches';

-- Create processing_batches table
CREATE TABLE IF NOT EXISTS public.processing_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  total_fees decimal(10,2) NOT NULL,
  advance_count integer NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_processing_batches_updated_at ON public.processing_batches;
CREATE TRIGGER update_processing_batches_updated_at
    BEFORE UPDATE ON public.processing_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'processing_batches' 
AND table_schema = 'public'
ORDER BY ordinal_position;




