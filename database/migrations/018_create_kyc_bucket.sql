-- Create bucket idempotently without relying on storage.create_bucket signature
insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', true)
on conflict (id) do nothing;

-- Policies to allow authenticated users to manage only their own folder (<uid>/...)
-- Read
drop policy if exists "KYC read own objects" on storage.objects;
create policy "KYC read own objects" on storage.objects
  for select
  using (
    bucket_id = 'kyc' and name like auth.uid()::text || '/%'
  );

-- Insert
drop policy if exists "KYC insert own objects" on storage.objects;
create policy "KYC insert own objects" on storage.objects
  for insert
  with check (
    bucket_id = 'kyc' and name like auth.uid()::text || '/%'
  );

-- Update
drop policy if exists "KYC update own objects" on storage.objects;
create policy "KYC update own objects" on storage.objects
  for update
  using (
    bucket_id = 'kyc' and name like auth.uid()::text || '/%'
  )
  with check (
    bucket_id = 'kyc' and name like auth.uid()::text || '/%'
  );

-- Delete
drop policy if exists "KYC delete own objects" on storage.objects;
create policy "KYC delete own objects" on storage.objects
  for delete
  using (
    bucket_id = 'kyc' and name like auth.uid()::text || '/%'
  );


