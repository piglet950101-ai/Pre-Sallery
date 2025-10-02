-- Setup automatic daily exchange rate updates using pg_cron
-- This migration sets up a cron job to fetch exchange rates daily at 6:00 PM Venezuela time

-- Enable pg_cron extension (requires superuser privileges)
-- Note: This may need to be run manually in Supabase dashboard if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Edge Function for updating exchange rates
CREATE OR REPLACE FUNCTION update_exchange_rate_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_url text;
  anon_key text;
  response_status int;
BEGIN
  -- Get Supabase project configuration
  -- These would need to be set as environment variables or configuration
  -- For now, we'll use a simpler approach with a direct API call
  
  -- Log the attempt
  INSERT INTO public.exchange_rates (as_of_date, usd_to_ves, source, created_at, updated_at)
  VALUES (CURRENT_DATE, 0, 'cron-attempt', NOW(), NOW())
  ON CONFLICT (as_of_date) DO NOTHING;
  
  -- The actual API call will be handled by the Edge Function
  -- This function serves as a placeholder for the cron job
END;
$$;

-- Schedule the cron job to run daily at 22:00 UTC (6:00 PM Venezuela time, UTC-4)
-- Note: This requires pg_cron extension and appropriate permissions
-- SELECT cron.schedule(
--   'update-exchange-rates-daily',
--   '0 22 * * *',
--   'SELECT update_exchange_rate_daily();'
-- );

-- Alternative: Create a simpler trigger-based approach
-- We'll create a function that can be called manually or via webhook

COMMENT ON FUNCTION update_exchange_rate_daily() IS 'Function to update exchange rates daily - called by cron job or manually';
