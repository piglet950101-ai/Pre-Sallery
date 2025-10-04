-- Create payment-confirmations storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-confirmations',
  'payment-confirmations',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for payment-confirmations bucket

-- Allow operators to upload payment confirmations
DROP POLICY IF EXISTS "Operators can upload payment confirmations" ON storage.objects;
CREATE POLICY "Operators can upload payment confirmations" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-confirmations' AND
  EXISTS (
    SELECT 1 FROM public.operators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Allow public read access to payment confirmations
DROP POLICY IF EXISTS "Public read access to payment confirmations" ON storage.objects;
CREATE POLICY "Public read access to payment confirmations" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-confirmations');

-- Allow operators to update their own uploaded confirmations
DROP POLICY IF EXISTS "Operators can update own payment confirmations" ON storage.objects;
CREATE POLICY "Operators can update own payment confirmations" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'payment-confirmations' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.operators 
    WHERE auth_user_id = auth.uid()
  )
) WITH CHECK (
  bucket_id = 'payment-confirmations' AND
  EXISTS (
    SELECT 1 FROM public.operators 
    WHERE auth_user_id = auth.uid()
  )
);

-- Allow operators to delete their own uploaded confirmations
DROP POLICY IF EXISTS "Operators can delete own payment confirmations" ON storage.objects;
CREATE POLICY "Operators can delete own payment confirmations" ON storage.objects
FOR DELETE USING (
  bucket_id = 'payment-confirmations' AND
  owner = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.operators 
    WHERE auth_user_id = auth.uid()
  )
);
