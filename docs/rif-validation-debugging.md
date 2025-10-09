# RIF Validation Debugging Guide

## Issue: Function Returns Same Result Every Time

### Problem Description
The RIF validation function is returning the exact same result regardless of the uploaded file:
```json
{
    "success": true,
    "expiration_date": "2026-04-28",
    "is_expired": false,
    "days_until_expiration": 206,
    "message": "Document is valid until 4/28/2026",
    "extracted_text_preview": "REPUBLICA BOLIVARIANA DE VENEZUELA...",
    "extracted_text_full": "REPUBLICA BOLIVARIANA DE VENEZUELA...",
    "ocr_status": "fallback_testing"
}
```

### Debugging Steps Added

#### 1. Request Tracking
Each request now includes:
- **Request ID**: Unique identifier for each request
- **Processing Timestamp**: When the request was processed
- **File Hash**: First 20 and last 20 characters of base64 content

#### 2. Enhanced Logging
The function now logs:
```
=== REQUEST RECEIVED [abc123] ===
Has document_text: false
Has document_url: false
Has file_content: true
Has file_type: image/jpeg
File content length: 245760
Request timestamp: 2024-01-15T10:30:45.123Z

=== PROCESSING UPLOADED FILE [abc123] ===
File type: image/jpeg
File content length: 245760
Base64 preview: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=...
Base64 ends with: ...9k=
File content hash: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=
```

#### 3. Response Tracking
Each response now includes:
```json
{
  "success": true,
  "is_expired": false,
  "expiration_date": "2025-12-31T00:00:00.000Z",
  "days_until_expiration": 350,
  "extracted_text": "REPUBLICA BOLIVARIANA DE VENEZUELA...",
  "message": "El documento RIF es válido hasta 31/12/2025",
  "request_id": "abc123",
  "file_hash": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "processing_timestamp": "2024-01-15T10:30:45.123Z"
}
```

### How to Debug

#### 1. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Upload a RIF document
4. Look for the new debug information:
   - Request ID should be different for each upload
   - File hash should be different for different files
   - Processing timestamp should be current

#### 2. Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → validate-rif-expiration
3. Check the Logs tab
4. Look for the enhanced logging with request IDs

#### 3. Verify File Processing
- **Same Request ID**: If you see the same request ID, the function is being cached
- **Same File Hash**: If you see the same file hash, you're uploading the same file
- **Same Timestamp**: If you see the same timestamp, there might be caching issues

### Possible Causes

#### 1. Browser Caching
- **Solution**: Clear browser cache or use incognito mode
- **Check**: Look for different request IDs in console

#### 2. Supabase Function Caching
- **Solution**: Redeploy the function
- **Check**: Look for different processing timestamps

#### 3. Same File Being Uploaded
- **Solution**: Try uploading a completely different RIF document
- **Check**: Look for different file hashes

#### 4. Function Not Processing Uploaded File
- **Solution**: Check if the function is actually receiving file_content
- **Check**: Look for "Has file_content: true" in logs

### Testing Steps

#### 1. Upload Different Files
1. Upload a RIF document
2. Note the request_id and file_hash
3. Upload a completely different RIF document
4. Check if request_id and file_hash are different

#### 2. Check Processing Logs
1. Look for "=== PROCESSING UPLOADED FILE ===" in logs
2. Check if OCR extraction is actually running
3. Verify extracted text is different for different files

#### 3. Verify Response Data
1. Check if extracted_text is different for different files
2. Verify expiration_date changes based on actual document
3. Confirm message reflects actual document data

### Expected Behavior

#### For Different Files:
- **Request ID**: Should be different (e.g., "abc123", "def456")
- **File Hash**: Should be different (different base64 content)
- **Processing Timestamp**: Should be different (current time)
- **Extracted Text**: Should reflect actual document content
- **Expiration Date**: Should match the actual document date

#### For Same File:
- **Request ID**: Should be different (new request)
- **File Hash**: Should be the same (same file content)
- **Processing Timestamp**: Should be different (new processing time)
- **Extracted Text**: Should be the same (same document)
- **Expiration Date**: Should be the same (same document)

### If Still Getting Same Results

#### 1. Check Function Deployment
```bash
# Redeploy the function
supabase functions deploy validate-rif-expiration
```

#### 2. Check Function Code
- Ensure no hardcoded test data
- Verify OCR is actually running
- Check for any early returns with test data

#### 3. Check Request Data
- Verify file_content is being sent from frontend
- Check if file_type is correct
- Ensure base64 encoding is working

#### 4. Check OCR Processing
- Look for "=== OCR EXTRACTION START ===" in logs
- Verify Tesseract.js is actually running
- Check if extracted text is different for different files

This debugging approach should help identify exactly where the issue is occurring and ensure the function is processing actual uploaded files rather than returning cached or hardcoded results.
