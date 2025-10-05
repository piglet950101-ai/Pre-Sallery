# Accurate OCR Setup for RIF Validation

## Overview
The RIF validation system now uses **real, accurate OCR services** to extract text from your actual RIF documents. No more simulated data - only real text extraction from your uploaded documents.

## Required Setup for Accurate OCR

### 1. Google Vision API (Recommended - Highest Accuracy)

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select project
3. Enable Vision API
4. Create API key
5. Set in Supabase:

```bash
supabase secrets set GOOGLE_VISION_API_KEY=your_google_api_key_here --project-ref pwlfihzqpgixswmqyjvw
```

**Pricing:** First 1,000 requests/month FREE, then $1.50 per 1,000 requests

### 2. OCR.space Premium (Backup Service)

**Setup:**
1. Go to [OCR.space](https://ocr.space/)
2. Sign up for premium account
3. Get API key
4. Set in Supabase:

```bash
supabase secrets set OCR_SPACE_API_KEY=your_ocr_space_key_here --project-ref pwlfihzqpgixswmqyjvw
```

**Pricing:** $0.50 per 1,000 requests

### 3. AWS Textract (Optional - Enterprise Grade)

**Setup:**
1. Go to [AWS Console](https://console.aws.amazon.com/)
2. Enable Textract service
3. Create IAM user with Textract permissions
4. Set credentials in Supabase:

```bash
supabase secrets set AWS_ACCESS_KEY_ID=your_access_key --project-ref pwlfihzqpgixswmqyjvw
supabase secrets set AWS_SECRET_ACCESS_KEY=your_secret_key --project-ref pwlfihzqpgixswmqyjvw
supabase secrets set AWS_REGION=us-east-1 --project-ref pwlfihzqpgixswmqyjvw
```

**Pricing:** $1.50 per 1,000 pages

## How It Works

1. **Primary:** Google Vision API (highest accuracy)
2. **Backup:** OCR.space Premium (good accuracy)
3. **Enterprise:** AWS Textract (document-optimized)

## Expected Results

**With Real OCR:**
```json
{
  "success": true,
  "expiration_date": "2025-04-28",
  "is_expired": false,
  "days_until_expiration": 175,
  "message": "Document is valid until 4/28/2025",
  "extracted_text_preview": "REPUBLICA BOLIVARIANA DE VENEZUELA...",
  "ocr_status": "real_accurate_ocr"
}
```

**If OCR Fails:**
```json
{
  "success": false,
  "error": "All OCR services failed. Unable to extract text from document. Please try a clearer image or contact support."
}
```

## Benefits

- ✅ **Real Data Only** - No simulated data
- ✅ **High Accuracy** - Professional OCR services
- ✅ **Multiple Fallbacks** - Multiple services for reliability
- ✅ **Clear Error Messages** - Tells you exactly what's wrong
- ✅ **Production Ready** - Enterprise-grade accuracy

## Troubleshooting

### "Google Vision API key not configured"
- Set `GOOGLE_VISION_API_KEY` in Supabase secrets
- Ensure API key has Vision API enabled

### "All OCR services failed"
- Check image quality (should be clear, high resolution)
- Try different image format (JPG, PNG)
- Ensure document is not handwritten
- Contact support if issue persists

### "No text found in document"
- Document may be too blurry or low quality
- Try scanning at higher resolution
- Ensure document is in Spanish/English
