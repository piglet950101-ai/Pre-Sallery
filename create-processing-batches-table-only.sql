-- Create the missing processing_batches table
-- Run this in your Supabase SQL Editor

-- Create processing_batches table
CREATE TABLE public.processing_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_name text NOT NULL,
  total_amount numeric NOT NULL,
  total_fees numeric NOT NULL,
  advance_count integer NOT NULL,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT processing_batches_pkey PRIMARY KEY (id)
);

-- Enable RLS on processing_batches
ALTER TABLE public.processing_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for operators to access processing_batches
DROP POLICY IF EXISTS "Processing batches: operator can manage all" ON public.processing_batches;
CREATE POLICY "Processing batches: operator can manage all" ON public.processing_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (
        (auth.users.raw_user_meta_data->>'role') = 'operator' 
        OR (auth.users.app_metadata->>'role') = 'operator'
      )
    )
  );

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_processing_batches_status ON public.processing_batches(status);
CREATE INDEX IF NOT EXISTS idx_processing_batches_created_at ON public.processing_batches(created_at);

-- Verify the table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'processing_batches';




