# Daily Exchange Rate Check Setup

This guide explains how to set up automatic daily exchange rate checks at 6:10 PM.

## 🎯 Overview

The system will automatically check and update exchange rates every day at 6:10 PM, ensuring your rates are always current and reducing manual intervention.

## 📋 Components Created

### 1. Supabase Function
- **File**: `supabase/functions/daily-rate-check/index.ts`
- **Purpose**: Checks exchange rate status and updates if needed
- **Features**:
  - Checks if rate is stale (>6 hours old)
  - Fetches latest rate from BCV API
  - Creates notifications for status updates
  - Handles API failures gracefully

### 2. GitHub Actions Workflow
- **File**: `.github/workflows/daily-rate-check.yml`
- **Purpose**: Triggers the function daily at 6:10 PM UTC
- **Features**:
  - Runs automatically every day
  - Can be triggered manually
  - Logs results and status

### 3. Admin Interface
- **File**: `src/components/ExchangeRateScheduler.tsx`
- **Purpose**: Shows admin the status of scheduled checks
- **Features**:
  - View last check time and status
  - See next scheduled check
  - Trigger manual checks
  - View check history

## 🚀 Setup Instructions

### Step 1: Deploy the Function

```bash
# Deploy the function to Supabase
supabase functions deploy daily-rate-check
```

### Step 2: Set Up GitHub Actions

1. **Add Secrets to GitHub Repository**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Add these secrets:
     - `SUPABASE_URL`: Your Supabase project URL
     - `SUPABASE_ANON_KEY`: Your Supabase anon key

2. **Enable GitHub Actions**:
   - The workflow file is already created
   - GitHub Actions will automatically run the workflow
   - You can also trigger it manually from the Actions tab

### Step 3: Verify Setup

1. **Check Admin Dashboard**:
   - Login as an operator/admin
   - Look for "Daily Exchange Rate Check" card
   - Verify it shows the next scheduled check time

2. **Test Manual Trigger**:
   - Click "Check Now" button in the admin interface
   - Check notifications for results

## ⏰ Schedule Details

- **Time**: 6:10 PM UTC daily
- **Local Times**:
  - Caracas (VET): 2:10 PM
  - New York (EST): 1:10 PM
  - Los Angeles (PST): 10:10 AM

## 📊 What the System Does

### Daily Check Process:

1. **Status Check**: Verifies if current rate is stale (>24 hours old)
2. **API Fetch**: Gets latest rate from BCV API
3. **Update Database**: Updates exchange_rates table
4. **Notification**: Creates admin notification with results
5. **Logging**: Records all activities for monitoring

### Success Scenarios:
- ✅ Rate is current → Logs success, no action needed
- ✅ Rate is stale (>24 hours) → Updates with new rate, logs success
- ✅ API unavailable → Logs error, keeps existing rate

### Failure Handling:
- 🔄 API timeout → Retries with fallback
- 🔄 Invalid response → Logs error, keeps existing rate
- 🔄 Database error → Logs error, notifies admin

## 🔧 Alternative Setup Methods

### Option 1: Vercel Cron Jobs
```javascript
// api/cron/daily-rate-check.js
export default async function handler(req, res) {
  const response = await fetch('https://your-project.supabase.co/functions/v1/daily-rate-check', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  res.status(200).json({ success: true });
}
```

### Option 2: AWS Lambda + EventBridge
```yaml
# serverless.yml
functions:
  dailyRateCheck:
    handler: daily-rate-check.handler
    events:
      - schedule: cron(10 18 * * ? *)
```

### Option 3: Google Cloud Scheduler
```bash
# Create a Cloud Scheduler job
gcloud scheduler jobs create http daily-rate-check \
  --schedule="10 18 * * *" \
  --uri="https://your-project.supabase.co/functions/v1/daily-rate-check" \
  --http-method=POST \
  --headers="Authorization=Bearer YOUR_ANON_KEY,Content-Type=application/json"
```

## 📈 Monitoring

### Admin Dashboard Features:
- **Status Display**: Shows last check time and result
- **Manual Trigger**: "Check Now" button for immediate checks
- **History**: View recent check results and notifications
- **Next Check**: Shows when the next automatic check will run

### Notifications:
- **Success**: "Exchange rate updated to X VES"
- **Warning**: "Rate is current, no update needed"
- **Error**: "Failed to update - API unavailable"

## 🛠️ Troubleshooting

### Common Issues:

1. **Function Not Deployed**:
   ```bash
   supabase functions deploy daily-rate-check
   ```

2. **GitHub Actions Not Running**:
   - Check repository secrets are set
   - Verify workflow file is in `.github/workflows/`
   - Check Actions tab for error logs

3. **API Failures**:
   - Check BCV API status: `https://bcv-api.rafnixg.dev/rates/`
   - Review function logs in Supabase dashboard
   - Check notifications for error details

4. **Database Issues**:
   - Verify `exchange_rates` table exists
   - Check RLS policies allow function access
   - Review database logs for errors

## 📝 Maintenance

### Regular Tasks:
- **Monitor Notifications**: Check for failed updates
- **Review Logs**: Weekly review of check results
- **API Health**: Verify BCV API is responding
- **Rate Accuracy**: Compare with other sources if needed

### Manual Override:
- Use admin interface to set manual rates
- System will warn if manual rate differs significantly from API
- Manual rates take precedence over automatic updates

## ✅ Success Indicators

You'll know the system is working when:
- ✅ Admin dashboard shows "Daily Exchange Rate Check" card
- ✅ Notifications appear after 6:10 PM daily
- ✅ Exchange rate bar shows current rates
- ✅ No "Rate may be outdated" warnings appear

The system is now fully automated and will keep your exchange rates current without manual intervention! 🎉
