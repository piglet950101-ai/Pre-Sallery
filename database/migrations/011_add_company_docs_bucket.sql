-- Create public bucket for company documents (RIF images)
insert into storage.buckets (id, name, public)
values ('company-docs', 'company-docs', true)
on conflict (id) do nothing;

-- Storage policies for the bucket
-- Allow public read
drop policy if exists "Public read access to company-docs" on storage.objects;
create policy "Public read access to company-docs"
on storage.objects for select
using ( bucket_id = 'company-docs' );

-- Allow inserts by anyone (anon or authenticated) to enable signup flow uploads
drop policy if exists "Anyone can upload to company-docs" on storage.objects;
create policy "Anyone can upload to company-docs"
on storage.objects for insert
with check ( bucket_id = 'company-docs' );

-- Allow updates/deletes by owners (adjust as needed)
drop policy if exists "Owners can update their files in company-docs" on storage.objects;
create policy "Owners can update their files in company-docs"
on storage.objects for update
using (
  bucket_id = 'company-docs' and auth.uid() is not null
);

drop policy if exists "Owners can delete their files in company-docs" on storage.objects;
create policy "Owners can delete their files in company-docs"
on storage.objects for delete
using (
  bucket_id = 'company-docs' and auth.uid() is not null
);

