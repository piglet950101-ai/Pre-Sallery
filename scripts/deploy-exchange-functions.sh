#!/bin/bash

# Deploy all exchange rate functions
echo "Deploying exchange rate functions..."

echo "1. Deploying update-exchange-rate..."
supabase functions deploy update-exchange-rate

echo "2. Deploying daily-exchange-update..."
supabase functions deploy daily-exchange-update

echo "3. Deploying hourly-exchange-update..."
supabase functions deploy hourly-exchange-update

echo "4. Deploying check-exchange-rate-status..."
supabase functions deploy check-exchange-rate-status

echo "All exchange rate functions deployed successfully!"

echo ""
echo "Test the functions with:"
echo "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-exchange-rate -H 'Authorization: Bearer YOUR_ANON_KEY'"
echo "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/hourly-exchange-update -H 'Authorization: Bearer YOUR_ANON_KEY'"
echo "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-exchange-rate-status -H 'Authorization: Bearer YOUR_ANON_KEY'"
