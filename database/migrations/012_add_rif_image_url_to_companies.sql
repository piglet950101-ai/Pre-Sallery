-- Add rif_image_url column to companies table
alter table public.companies
add column if not exists rif_image_url text;

-- Optional index if querying by rif_image_url
-- create index if not exists idx_companies_rif_image_url on public.companies(rif_image_url);

