# Test Exchange Rate Functions
# Replace YOUR_ANON_KEY with your actual Supabase anon key

param(
    [Parameter(Mandatory=$true)]
    [string]$ApiKey
)

$baseUrl = "https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1"
$headers = @{
    "Authorization" = "Bearer $ApiKey"
    "Content-Type" = "application/json"
}

Write-Host "Testing Exchange Rate Functions..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test 1: Real-time Update
Write-Host "`n1. Testing Real-time Update Function..." -ForegroundColor Yellow
try {
    $response1 = Invoke-WebRequest -Uri "$baseUrl/realtime-exchange-update" -Method POST -Headers $headers
    $result1 = $response1.Content | ConvertFrom-Json
    
    if ($result1.success) {
        Write-Host "✅ Real-time update successful!" -ForegroundColor Green
        Write-Host "   Rate: $($result1.rate) VES per USD" -ForegroundColor Cyan
        Write-Host "   Source: $($result1.source)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Real-time update failed: $($result1.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Real-time update error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Status Check
Write-Host "`n2. Testing Status Check Function..." -ForegroundColor Yellow
try {
    $response2 = Invoke-WebRequest -Uri "$baseUrl/check-exchange-rate-status" -Method POST -Headers $headers
    $result2 = $response2.Content | ConvertFrom-Json
    
    if ($result2.success) {
        Write-Host "✅ Status check successful!" -ForegroundColor Green
        Write-Host "   Has rate today: $($result2.status.hasRateToday)" -ForegroundColor Cyan
        Write-Host "   Is stale: $($result2.status.isStale)" -ForegroundColor Cyan
        Write-Host "   Last update: $($result2.status.lastUpdate)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Status check failed: $($result2.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Status check error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Manual Update (fallback)
Write-Host "`n3. Testing Manual Update Function..." -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "$baseUrl/update-exchange-rate" -Method POST -Headers $headers
    $result3 = $response3.Content | ConvertFrom-Json
    
    if ($result3.ok) {
        Write-Host "✅ Manual update successful!" -ForegroundColor Green
        Write-Host "   Rate: $($result3.rate) VES per USD" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Manual update failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Manual update error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=================================" -ForegroundColor Green
Write-Host "Testing complete! Check your operator dashboard for alerts." -ForegroundColor Green
Write-Host "`nIf all tests passed, your cron jobs should work with the same API key." -ForegroundColor Cyan
