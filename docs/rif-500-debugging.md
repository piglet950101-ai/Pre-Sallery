# RIF Validation 500 Error Debugging Guide

## Issue: Persistent 500 Internal Server Error

### Problem Analysis
The 500 Internal Server Error is still occurring despite enhanced error handling, which suggests there might be a fundamental issue with:
1. **Function deployment** - The function might not be properly deployed
2. **Dependencies** - Tesseract.js or other dependencies might be causing issues
3. **Function complexity** - The function might be too complex for the Edge Function environment
4. **Memory/timeout issues** - The function might be running out of memory or timing out

### Debugging Solutions

#### **1. Simple Test Functions Created**

I've created two simplified test functions to isolate the issue:

##### **A. Minimal Function** (`validate-rif-expiration-minimal`)
```typescript
// Minimal RIF validation function for testing
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

serve(async (req) => {
  console.log('=== MINIMAL RIF FUNCTION START ===');
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: cors()
    });
  }
  
  try {
    const body = await req.json();
    console.log('Request body received:', Object.keys(body));
    
    // Simple test response
    return new Response(JSON.stringify({
      success: true,
      message: "Minimal RIF validation working",
      received_data: {
        has_file_content: !!body.file_content,
        has_file_type: !!body.file_type,
        file_type: body.file_type,
        file_content_length: body.file_content ? body.file_content.length : 0
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
  }
});
```

##### **B. Simple Function** (`validate-rif-expiration-simple`)
```typescript
// Simple RIF validation function for testing
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

serve(async (req) => {
  console.log('=== SIMPLE RIF FUNCTION START ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  if (req.method === "OPTIONS") {
    console.log('Handling OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: cors()
    });
  }
  
  try {
    console.log('Processing request...');
    
    // Simple test endpoint
    if (req.url.includes('/test')) {
      console.log('Test endpoint called');
      return new Response(JSON.stringify({
        success: true,
        message: "Simple RIF Function is working",
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...cors()
        }
      });
    }
    
    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully');
    } catch (jsonError) {
      console.error('Failed to parse request body:', jsonError);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid JSON in request body",
        message: "Error al procesar la solicitud. Verifica que los datos sean válidos."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...cors()
        }
      });
    }
    
    const { document_text, document_url, file_content, file_type } = requestBody;
    
    console.log('=== REQUEST RECEIVED ===');
    console.log('Has document_text:', !!document_text);
    console.log('Has document_url:', !!document_url);
    console.log('Has file_content:', !!file_content);
    console.log('Has file_type:', file_type);
    console.log('File content length:', file_content ? file_content.length : 0);
    
    // Simple response for testing
    return new Response(JSON.stringify({
      success: true,
      message: "Simple RIF validation completed",
      file_type: file_type,
      file_content_length: file_content ? file_content.length : 0,
      has_document_text: !!document_text,
      has_document_url: !!document_url,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
    
  } catch (error) {
    console.error('=== SIMPLE RIF FUNCTION ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error",
      message: "Error interno del servidor. Intenta nuevamente.",
      error_details: {
        type: error.constructor.name,
        message: error.message
      },
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
  }
});
```

#### **2. Debug Test Script**

I've created a comprehensive debug test script (`test-rif-debug.js`) that tests:
- **Simple endpoint** - Tests if the function is working
- **Minimal data** - Tests with basic document text
- **File content** - Tests with file upload
- **Empty data** - Tests with no data

#### **3. Testing Steps**

##### **Step 1: Deploy Simple Functions**
1. Deploy the minimal function: `validate-rif-expiration-minimal`
2. Deploy the simple function: `validate-rif-expiration-simple`
3. Test both functions to see if they work

##### **Step 2: Test with Debug Script**
1. Open browser console
2. Run the debug script: `testRIFDebug()`
3. Check the responses for each test

##### **Step 3: Compare Results**
1. If simple functions work but original doesn't, the issue is with complexity
2. If simple functions also fail, the issue is with deployment or environment
3. If only original fails, the issue is with Tesseract.js or dependencies

#### **4. Possible Issues and Solutions**

##### **A. Function Deployment Issues**
- **Issue**: Function not properly deployed
- **Solution**: Redeploy the function
- **Check**: Verify function is enabled in Supabase dashboard

##### **B. Tesseract.js Issues**
- **Issue**: Tesseract.js causing memory or timeout issues
- **Solution**: Use simplified OCR or different approach
- **Check**: Test without Tesseract.js

##### **C. Function Complexity Issues**
- **Issue**: Function too complex for Edge Function environment
- **Solution**: Simplify the function
- **Check**: Test with minimal functionality

##### **D. Memory/Timeout Issues**
- **Issue**: Function running out of memory or timing out
- **Solution**: Optimize function or increase limits
- **Check**: Check function limits in Supabase dashboard

#### **5. Next Steps**

1. **Deploy the simple functions** and test them
2. **Run the debug script** to identify the specific issue
3. **Compare results** between simple and complex functions
4. **Report findings** based on the test results

The simplified functions should help identify exactly what's causing the 500 Internal Server Error!
