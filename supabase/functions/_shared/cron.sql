-- Enable pg_cron extension if not already enabled
-- This should be run as a superuser in the Supabase dashboard SQL editor

-- Create a daily cron job to update exchange rates at 6:00 PM (18:00) Venezuela time
-- Venezuela is UTC-4, so 18:00 VET = 22:00 UTC
SELECT cron.schedule(
  'update-exchange-rates-daily',
  '0 22 * * *', -- Every day at 22:00 UTC (6:00 PM Venezuela time)
  $$
  SELECT net.http_post(
    url := 'https://YOUR_SUPABASE_PROJECT_URL.supabase.co/functions/v1/update-exchange-rate',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- To check existing cron jobs:
-- SELECT * FROM cron.job;

-- To remove the cron job if needed:
-- SELECT cron.unschedule('update-exchange-rates-daily');
