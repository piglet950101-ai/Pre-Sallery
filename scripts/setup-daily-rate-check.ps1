# Setup Daily Exchange Rate Check at 6:10 PM
# This script sets up a scheduled task to check exchange rates daily at 6:10 PM

Write-Host "Setting up daily exchange rate check at 6:10 PM..." -ForegroundColor Green

# Get the current directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Check if we're in the right directory
if (-not (Test-Path "$ProjectRoot/package.json")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Deploy the function to Supabase
Write-Host "Deploying daily-rate-check function to Supabase..." -ForegroundColor Yellow
Set-Location $ProjectRoot

# Deploy the function
supabase functions deploy daily-rate-check

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function deployed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy function" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Manual Setup Required:" -ForegroundColor Cyan
Write-Host "1. Get your Supabase project URL and anon key"
Write-Host "2. Set up a scheduled task with this command:"
Write-Host "   curl -X POST `"https://your-project-ref.supabase.co/functions/v1/daily-rate-check`" -H `"Authorization: Bearer YOUR_ANON_KEY`" -H `"Content-Type: application/json`""
Write-Host ""
Write-Host "🔧 Alternative: Use a cron service like:" -ForegroundColor Yellow
Write-Host "   - GitHub Actions (recommended)"
Write-Host "   - Vercel Cron Jobs"
Write-Host "   - AWS Lambda with EventBridge"
Write-Host "   - Google Cloud Scheduler"
Write-Host ""
Write-Host "📝 GitHub Actions Example:" -ForegroundColor Cyan
Write-Host "Create .github/workflows/daily-rate-check.yml with:"
Write-Host ""

$GitHubWorkflow = @"
name: Daily Exchange Rate Check
on:
  schedule:
    - cron: '10 18 * * *'  # 6:10 PM daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-rate:
    runs-on: ubuntu-latest
    steps:
      - name: Check Exchange Rate
        run: |
          curl -X POST "`${{ secrets.SUPABASE_URL }}/functions/v1/daily-rate-check" \
            -H "Authorization: Bearer `${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
"@

Write-Host $GitHubWorkflow

Write-Host ""
Write-Host "✅ Setup complete! Choose your preferred scheduling method above." -ForegroundColor Green
