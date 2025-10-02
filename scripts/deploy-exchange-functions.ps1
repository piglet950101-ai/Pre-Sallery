# Deploy all exchange rate functions
Write-Host "Deploying exchange rate functions..." -ForegroundColor Green

Write-Host "1. Deploying update-exchange-rate..." -ForegroundColor Yellow
supabase functions deploy update-exchange-rate

Write-Host "2. Deploying daily-exchange-update..." -ForegroundColor Yellow
supabase functions deploy daily-exchange-update

Write-Host "3. Deploying hourly-exchange-update..." -ForegroundColor Yellow
supabase functions deploy hourly-exchange-update

Write-Host "4. Deploying check-exchange-rate-status..." -ForegroundColor Yellow
supabase functions deploy check-exchange-rate-status

Write-Host "All exchange rate functions deployed successfully!" -ForegroundColor Green

Write-Host ""
Write-Host "Test the functions with:" -ForegroundColor Cyan
Write-Host "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/update-exchange-rate -H 'Authorization: Bearer YOUR_ANON_KEY'" -ForegroundColor Gray
Write-Host "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/hourly-exchange-update -H 'Authorization: Bearer YOUR_ANON_KEY'" -ForegroundColor Gray
Write-Host "curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/check-exchange-rate-status -H 'Authorization: Bearer YOUR_ANON_KEY'" -ForegroundColor Gray
