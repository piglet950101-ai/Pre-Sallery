# RIF Validation 500 Error Troubleshooting Guide

## Issue: Persistent 500 Internal Server Error

### Problem Description
The RIF validation function is still returning a 500 Internal Server Error despite enhanced error handling. This suggests there might be a fundamental issue with the Edge Function deployment or configuration.

### Enhanced Debugging Features Added

#### **1. Simple Test Endpoint**
```typescript
// Simple test endpoint
if (req.url.includes('/test')) {
  console.log('Test endpoint called');
  return new Response(JSON.stringify({
    success: true,
    message: "Edge Function is working",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}
```

#### **2. Enhanced Request Logging**
```typescript
console.log('=== EDGE FUNCTION START ===');
console.log('Request method:', req.method);
console.log('Request URL:', req.url);
console.log('Request headers:', Object.fromEntries(req.headers.entries()));
```

#### **3. Parameter Validation**
```typescript
// Validate required parameters
if (!document_text && !document_url && !file_content) {
  console.log('❌ No valid input provided');
  return new Response(JSON.stringify({
    success: false,
    error: "Missing required parameters",
    message: "Se requiere texto del documento, URL del documento o contenido del archivo."
  }), {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}
```

#### **4. Fallback Response**
```typescript
// If we reach here, no valid input was processed
console.log('❌ No valid input was processed');
return new Response(JSON.stringify({
  success: false,
  error: "No valid input processed",
  message: "No se pudo procesar ningún tipo de entrada válida.",
  request_id: requestId,
  processing_timestamp: new Date().toISOString()
}), {
  status: 400,
  headers: {
    "Content-Type": "application/json",
    ...cors()
  }
});
```

### Testing Steps

#### **1. Test Simple Endpoint**
```javascript
// Test the simple endpoint
fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration/test')
  .then(response => response.json())
  .then(data => console.log('Test endpoint response:', data))
  .catch(error => console.error('Test endpoint error:', error));
```

#### **2. Test with Minimal Data**
```javascript
// Test with minimal data
fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  },
  body: JSON.stringify({
    document_text: 'FECHA DE VENCIMIENTO: 31/12/2025'
  })
})
.then(response => response.json())
.then(data => console.log('Minimal data response:', data))
.catch(error => console.error('Minimal data error:', error));
```

#### **3. Test with File Content**
```javascript
// Test with file content
fetch('https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here'
  },
  body: JSON.stringify({
    file_content: 'test-content',
    file_type: 'application/pdf'
  })
})
.then(response => response.json())
.then(data => console.log('File content response:', data))
.catch(error => console.error('File content error:', error));
```

### What to Look For in Logs

#### **1. Function Startup**
```
=== EDGE FUNCTION START ===
Request method: POST
Request URL: https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration
Request headers: { "content-type": "application/json", "authorization": "Bearer ..." }
Processing request...
```

#### **2. Test Endpoint**
```
Test endpoint called
```

#### **3. Request Processing**
```
=== REQUEST RECEIVED [abc123] ===
Has document_text: false
Has document_url: false
Has file_content: true
Has file_type: application/pdf
File content length: 245760
Request timestamp: 2024-01-15T10:30:45.123Z
```

#### **4. Error Handling**
```
❌ No valid input provided
```

### Common Issues and Solutions

#### **1. Function Not Deployed**
- **Issue**: Function not deployed or deployment failed
- **Solution**: Redeploy the function
- **Check**: Look for deployment errors in Supabase dashboard

#### **2. Function Configuration Issues**
- **Issue**: Incorrect function configuration
- **Solution**: Check function settings in Supabase dashboard
- **Check**: Verify function is enabled and configured correctly

#### **3. Dependencies Missing**
- **Issue**: Tesseract.js or other dependencies not available
- **Solution**: Check if dependencies are properly installed
- **Check**: Look for import errors in logs

#### **4. Memory/Timeout Issues**
- **Issue**: Function running out of memory or timing out
- **Solution**: Check function limits and optimize code
- **Check**: Look for memory or timeout errors in logs

#### **5. CORS Issues**
- **Issue**: CORS configuration problems
- **Solution**: Check CORS settings
- **Check**: Look for CORS errors in browser console

### Troubleshooting Steps

#### **1. Check Function Status**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Check if `validate-rif-expiration` is deployed and running
4. Look for any error indicators

#### **2. Check Function Logs**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → validate-rif-expiration
3. Check the Logs tab
4. Look for error messages or stack traces

#### **3. Test Simple Endpoint**
1. Open browser console
2. Run the test script: `testRIFFunction()`
3. Check if the simple endpoint works
4. Look for any error messages

#### **4. Check Function Configuration**
1. Verify function is enabled
2. Check function timeout settings
3. Verify memory limits
4. Check environment variables

#### **5. Redeploy Function**
1. If all else fails, redeploy the function
2. Check for deployment errors
3. Test again after deployment

### Next Steps

1. **Test the simple endpoint** using the test script
2. **Check Supabase logs** for specific error messages
3. **Verify function deployment** in Supabase dashboard
4. **Report specific errors** based on the logs

The enhanced debugging and test endpoint should help identify exactly what's causing the 500 Internal Server Error!
