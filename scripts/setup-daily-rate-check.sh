#!/bin/bash

# Setup Daily Exchange Rate Check at 6:10 PM
# This script sets up a cron job to check exchange rates daily at 6:10 PM

echo "Setting up daily exchange rate check at 6:10 PM..."

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Deploy the function to Supabase
echo "Deploying daily-rate-check function to Supabase..."
cd "$PROJECT_ROOT"

# Deploy the function
supabase functions deploy daily-rate-check

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully"
else
    echo "❌ Failed to deploy function"
    exit 1
fi

# Create a cron job entry
CRON_ENTRY="10 18 * * * curl -X POST \"https://your-project-ref.supabase.co/functions/v1/daily-rate-check\" -H \"Authorization: Bearer YOUR_ANON_KEY\" -H \"Content-Type: application/json\""

echo ""
echo "📋 Manual Setup Required:"
echo "1. Get your Supabase project URL and anon key"
echo "2. Set up a cron job with this command:"
echo "   $CRON_ENTRY"
echo ""
echo "🔧 Alternative: Use a cron service like:"
echo "   - GitHub Actions (recommended)"
echo "   - Vercel Cron Jobs"
echo "   - AWS Lambda with EventBridge"
echo "   - Google Cloud Scheduler"
echo ""
echo "📝 GitHub Actions Example:"
echo "Create .github/workflows/daily-rate-check.yml with:"
echo ""
cat << 'EOF'
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
          curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/daily-rate-check" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
EOF

echo ""
echo "✅ Setup complete! Choose your preferred scheduling method above."
