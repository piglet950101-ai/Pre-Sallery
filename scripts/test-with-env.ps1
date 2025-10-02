# Test Exchange Rate Functions using environment variables
# This script will try to read from .env.local or use environment variables

Write-Host "Testing Exchange Rate Functions with Environment Variables..." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Try to load from .env.local if it exists
$envFile = ".env.local"
$supabaseUrl = $null
$supabaseAnonKey = $null

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from .env.local..." -ForegroundColor Yellow
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^VITE_SUPABASE_URL=(.+)$") {
            $supabaseUrl = $matches[1]
        }
        if ($_ -match "^VITE_SUPABASE_ANON_KEY=(.+)$") {
            $supabaseAnonKey = $matches[1]
        }
    }
} else {
    Write-Host ".env.local not found, trying system environment variables..." -ForegroundColor Yellow
    $supabaseUrl = $env:VITE_SUPABASE_URL
    $supabaseAnonKey = $env:VITE_SUPABASE_ANON_KEY
}

# Check if we have the required variables
if (-not $supabaseUrl -or -not $supabaseAnonKey) {
    Write-Host "❌ Missing required environment variables!" -ForegroundColor Red
    Write-Host "Please ensure you have:" -ForegroundColor Yellow
    Write-Host "  VITE_SUPABASE_URL" -ForegroundColor Cyan
    Write-Host "  VITE_SUPABASE_ANON_KEY" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can also run this script with parameters:" -ForegroundColor Yellow
    Write-Host "  .\scripts\test-with-env.ps1 -Url 'your-url' -Key 'your-key'" -ForegroundColor Cyan
    exit 1
}

# Extract project reference from URL
$baseUrl = "$supabaseUrl/functions/v1"
Write-Host "Using Supabase URL: $supabaseUrl" -ForegroundColor Cyan
Write-Host "Functions URL: $baseUrl" -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $supabaseAnonKey"
    "Content-Type" = "application/json"
}

# Test 1: Real-time Update
Write-Host "`n1. Testing Real-time Update Function..." -ForegroundColor Yellow
try {
    $response1 = Invoke-WebRequest -Uri "$baseUrl/realtime-exchange-update" -Method POST -Headers $headers
    $result1 = $response1.Content | ConvertFrom-Json
    
    if ($result1.success) {
        Write-Host "✅ Real-time update successful!" -ForegroundColor Green
        Write-Host "   Rate: $($result1.rate) VES per USD" -ForegroundColor Cyan
        Write-Host "   Source: $($result1.source)" -ForegroundColor Cyan
        if ($result1.changePercent) {
            Write-Host "   Change: $($result1.changePercent)%" -ForegroundColor Cyan
        }
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
        if ($result2.status.lastUpdate) {
            Write-Host "   Last update: $($result2.status.lastUpdate)" -ForegroundColor Cyan
        }
        if ($result2.status.rate) {
            Write-Host "   Current rate: $($result2.status.rate)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "❌ Status check failed: $($result2.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Status check error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Hourly Update (backup)
Write-Host "`n3. Testing Hourly Update Function..." -ForegroundColor Yellow
try {
    $response3 = Invoke-WebRequest -Uri "$baseUrl/hourly-exchange-update" -Method POST -Headers $headers
    $result3 = $response3.Content | ConvertFrom-Json
    
    if ($result3.success) {
        Write-Host "✅ Hourly update successful!" -ForegroundColor Green
        Write-Host "   Rate: $($result3.rate) VES per USD" -ForegroundColor Cyan
        Write-Host "   Source: $($result3.source)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Hourly update failed: $($result3.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Hourly update error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=========================================================" -ForegroundColor Green
Write-Host "Testing complete!" -ForegroundColor Green
Write-Host "`nFor automatic updates, set up cron jobs with these URLs:" -ForegroundColor Cyan
Write-Host "  Real-time (15 min): $baseUrl/realtime-exchange-update" -ForegroundColor White
Write-Host "  Status check (30 min): $baseUrl/check-exchange-rate-status" -ForegroundColor White
Write-Host "`nUse this authorization header:" -ForegroundColor Cyan
Write-Host "  Authorization: Bearer $supabaseAnonKey" -ForegroundColor White
