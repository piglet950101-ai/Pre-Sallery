-- Add updated_at column to exchange_rates table and create trigger
ALTER TABLE public.exchange_rates 
ADD COLUMN IF NOT EXISTS updated_at timestamptz not null default now();

-- Create or update the trigger function to update updated_at on changes
CREATE OR REPLACE FUNCTION update_exchange_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_exchange_rates_updated_at_trigger ON public.exchange_rates;

-- Create trigger to automatically update updated_at on UPDATE
CREATE TRIGGER update_exchange_rates_updated_at_trigger
    BEFORE UPDATE ON public.exchange_rates
    FOR EACH ROW EXECUTE FUNCTION update_exchange_rates_updated_at();

-- Update the exchange_rate_latest view to include updated_at
CREATE OR REPLACE VIEW public.exchange_rate_latest AS
SELECT as_of_date, usd_to_ves, source, created_at, updated_at
FROM public.exchange_rates
ORDER BY as_of_date DESC, updated_at DESC
LIMIT 1;

-- Set updated_at to created_at for existing records
UPDATE public.exchange_rates 
SET updated_at = created_at 
WHERE updated_at IS NULL;
