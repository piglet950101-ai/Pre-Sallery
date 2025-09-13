-- Setup Supabase Storage for transfer confirmations
-- Run this in your Supabase SQL Editor

-- Create storage bucket for transfer confirmations
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-confirmations', 'transfer-confirmations', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for transfer confirmations bucket
-- Allow authenticated users to upload files
CREATE POLICY "Transfer confirmations: authenticated users can upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'transfer-confirmations' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to view files
CREATE POLICY "Transfer confirmations: authenticated users can view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'transfer-confirmations' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Transfer confirmations: authenticated users can delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'transfer-confirmations' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update files
CREATE POLICY "Transfer confirmations: authenticated users can update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'transfer-confirmations' 
  AND auth.role() = 'authenticated'
);
