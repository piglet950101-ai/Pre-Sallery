# Exchange Rate Real-Time Update Setup

This document explains how to set up real-time exchange rate updates with monitoring and alerts using Fawaz Ahmed Currency API.

## Components

1. **Edge Function**: `supabase/functions/update-exchange-rate/index.ts` - Handles manual and automatic rate updates
2. **Daily Update Function**: `supabase/functions/daily-exchange-update/index.ts` - Dedicated function for daily updates
3. **Hourly Update Function**: `supabase/functions/hourly-exchange-update/index.ts` - Real-time updates every hour
4. **Status Check Function**: `supabase/functions/check-exchange-rate-status/index.ts` - Monitors rate freshness and creates alerts
5. **Database**: `exchange_rates` table stores historical rates
6. **UI Components**: Real-time rate display with stale warnings and operator alerts

## Setup Instructions

### 1. Deploy Edge Functions

```bash
# Deploy all exchange rate functions
supabase functions deploy update-exchange-rate
supabase functions deploy daily-exchange-update
supabase functions deploy hourly-exchange-update
supabase functions deploy check-exchange-rate-status
```

### 2. Test Manual Update

```bash
# Test fetching current rate from API
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-exchange-rate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test the daily update function
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/daily-exchange-update \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 3. Set Up Real-Time Cron Jobs

For real-time updates, set up multiple cron jobs:

#### Option A: External Cron Service (Recommended)

Use a service like **cron-job.org**, **EasyCron**, or **GitHub Actions**:

**Real-time Updates (Every 15 minutes):**
1. Create a 15-minute cron job: `*/15 * * * *`
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/realtime-exchange-update`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_ANON_KEY`

**Hourly Backup Updates:**
1. Create an hourly cron job: `0 * * * *`
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/hourly-exchange-update`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_ANON_KEY`

**Daily Backup Updates:**
1. Create a daily cron job at 6:00 PM Venezuela time (22:00 UTC): `0 22 * * *`
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/daily-exchange-update`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_ANON_KEY`

**Status Monitoring:**
1. Create a status check every 30 minutes: `*/30 * * * *`
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/check-exchange-rate-status`
3. Method: POST
4. Headers: `Authorization: Bearer YOUR_ANON_KEY`

#### Option B: GitHub Actions (Free)

Create `.github/workflows/update-exchange-rate.yml`:

```yaml
name: Update Exchange Rate
on:
  schedule:
    - cron: '0 22 * * *'  # 6:00 PM Venezuela time (UTC-4)
  workflow_dispatch:  # Allow manual trigger

jobs:
  update-rate:
    runs-on: ubuntu-latest
    steps:
      - name: Update Exchange Rate
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }}/daily-exchange-update \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

#### Option C: Supabase pg_cron (Enterprise)

If you have pg_cron enabled:

```sql
SELECT cron.schedule(
  'update-exchange-rates-daily',
  '0 22 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/daily-exchange-update',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

## API Details

### Fawaz Ahmed Currency API

- **Primary Endpoint**: `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json`
- **Fallback Endpoint**: `https://latest.currency-api.pages.dev/v1/currencies/usd.json`
- **Completely Free**: No rate limits, no API key required
- **Features**: 200+ currencies, daily updated, blazing fast
- **Response Format**:
```json
{
  "date": "2024-01-15",
  "usd": {
    "ves": 36.123456,
    "eur": 0.85,
    "btc": 0.000023
  }
}
```

## Monitoring

- Check the `exchange_rates` table for daily updates
- Monitor Edge Function logs in Supabase dashboard
- Set up alerts if rates haven't been updated in 24+ hours

## Manual Override

Operators can still set manual rates via the UI, which will override the daily automatic rate for that day.

## Troubleshooting

1. **Function not deploying**: Check Supabase CLI is logged in and project is linked
2. **API failures**: The system automatically tries fallback URL if primary fails
3. **Cron not working**: Verify the external service is configured correctly
4. **Database errors**: Check RLS policies allow the service role to insert rates
5. **Rate not updating**: Check function logs for API response errors
