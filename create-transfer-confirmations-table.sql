-- Create transfer_confirmations table for operator dashboard
-- This table stores confirmation documents uploaded by operators

CREATE TABLE IF NOT EXISTS public.transfer_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid references public.processing_batches(id) on delete cascade,
  
  -- File information
  file_name text NOT NULL,
  file_path text NOT NULL, -- Path in Supabase Storage
  file_url text, -- Public URL for the file
  file_size bigint NOT NULL, -- File size in bytes
  file_type text NOT NULL, -- MIME type (e.g., 'application/pdf', 'image/jpeg')
  
  -- Upload information
  uploaded_by uuid references auth.users(id) on delete cascade,
  uploaded_at timestamptz DEFAULT now(),
  
  -- Status and processing
  status text NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on transfer_confirmations table
ALTER TABLE public.transfer_confirmations ENABLE ROW LEVEL SECURITY;

-- Transfer confirmations RLS policy (only operators can access)
DROP POLICY IF EXISTS "Transfer confirmations: operators only" ON public.transfer_confirmations;
CREATE POLICY "Transfer confirmations: operators only" ON public.transfer_confirmations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.app_metadata->>'role' = 'operator' OR auth.users.user_metadata->>'role' = 'operator')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_confirmations_batch_id ON public.transfer_confirmations(batch_id);
CREATE INDEX IF NOT EXISTS idx_transfer_confirmations_uploaded_by ON public.transfer_confirmations(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_transfer_confirmations_status ON public.transfer_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_transfer_confirmations_uploaded_at ON public.transfer_confirmations(uploaded_at);

-- Create trigger for transfer_confirmations updated_at
DROP TRIGGER IF EXISTS update_transfer_confirmations_updated_at ON public.transfer_confirmations;
CREATE TRIGGER update_transfer_confirmations_updated_at
    BEFORE UPDATE ON public.transfer_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
