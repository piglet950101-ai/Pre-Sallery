# RIF Mock OCR Testing Guide

## Issue: 500 Internal Server Error with Tesseract.js

### Problem Description
The RIF validation function is returning a 500 Internal Server Error, which suggests that Tesseract.js is causing the function to crash. To isolate the issue, I've temporarily disabled Tesseract.js and implemented a mock OCR function.

### Mock OCR Implementation

#### **1. Disabled Tesseract.js Import**
```typescript
// Temporarily disable Tesseract.js to test if it's causing the 500 error
// import { createWorker } from "https://esm.sh/tesseract.js@4.1.1";
```

#### **2. Mock OCR Function**
```typescript
// Mock OCR function for testing (Tesseract.js disabled)
async function extractTextFromFile(fileContent: string, fileType: string) {
  console.log('=== MOCK OCR EXTRACTION START ===');
  console.log('File type:', fileType);
  console.log('Content length:', fileContent.length);
  console.log('Base64 preview:', fileContent.substring(0, 100) + '...');
  
  try {
    console.log('Using mock OCR function...');
    
    // Return mock text for testing
    const mockText = `
      REPUBLICA BOLIVARIANA DE VENEZUELA
      SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
      REGISTRO DE INFORMACION FISCAL (RIF)
      
      DATOS DEL CONTRIBUYENTE
      RIF: J-12345678-9
      NOMBRE: EMPRESA EJEMPLO C.A.
      DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
      TELEFONO: (0212) 123-4567
      
      FECHA DE VENCIMIENTO: 31/12/2025
      VIGENCIA: 2023-2025
      
      Este documento es válido hasta la fecha de vencimiento indicada.
    `;
    
    console.log('Mock OCR extraction completed');
    console.log('Mock text length:', mockText.length);
    console.log('Mock text preview:', mockText.substring(0, 200) + '...');
    
    return mockText.trim();
    
  } catch (error) {
    console.error('=== MOCK OCR EXTRACTION FAILED ===');
    console.error('Mock OCR failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    throw new Error(`Mock OCR extraction failed: ${error.message}`);
  }
}
```

#### **3. Mock Fallback OCR Function**
```typescript
// Mock fallback OCR method (Tesseract.js disabled)
async function tryFallbackOCR(fileContent: string, fileType: string) {
  console.log('=== MOCK FALLBACK OCR START ===');
  
  try {
    // Return mock text for testing
    const mockText = `
      REPUBLICA BOLIVARIANA DE VENEZUELA
      SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
      REGISTRO DE INFORMACION FISCAL (RIF)
      
      FECHA DE VENCIMIENTO: 31/12/2025
      VIGENCIA: 2023-2025
    `;
    
    console.log('Mock fallback OCR completed');
    console.log('Mock fallback text length:', mockText.length);
    
    return mockText.trim();
    
  } catch (error) {
    console.error('Mock fallback OCR failed:', error);
    throw error;
  }
}
```

### What You'll See in Logs

#### **Successful Mock OCR Processing**
```
=== MOCK OCR EXTRACTION START ===
File type: image/png
Content length: 245760
Base64 preview: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=...
Using mock OCR function...
Mock OCR extraction completed
Mock text length: 1247
Mock text preview: REPUBLICA BOLIVARIANA DE VENEZUELA
SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
REGISTRO DE INFORMACION FISCAL (RIF)

DATOS DEL CONTRIBUYENTE
RIF: J-12345678-9
NOMBRE: EMPRESA EJEMPLO C.A.
DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
TELEFONO: (0212) 123-4567

FECHA DE VENCIMIENTO: 31/12/2025
VIGENCIA: 2023-2025

Este documento es válido hasta la fecha de vencimiento indicada.
...
```

#### **Expected Response**
```json
{
  "success": true,
  "is_expired": false,
  "expiration_date": "2025-12-31T00:00:00.000Z",
  "days_until_expiration": 350,
  "extracted_text": "REPUBLICA BOLIVARIANA DE VENEZUELA\nSERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA\nREGISTRO DE INFORMACION FISCAL (RIF)\n\nDATOS DEL CONTRIBUYENTE\nRIF: J-12345678-9\nNOMBRE: EMPRESA EJEMPLO C.A.\nDIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA\nTELEFONO: (0212) 123-4567\n\nFECHA DE VENCIMIENTO: 31/12/2025\nVIGENCIA: 2023-2025\n\nEste documento es válido hasta la fecha de vencimiento indicada.",
  "message": "El documento RIF es válido hasta 31/12/2025",
  "request_id": "abc123",
  "file_hash": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "processing_timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Testing Steps

#### **1. Test with Mock OCR**
1. Upload a RIF document (any image/PDF)
2. Check the browser console for logs
3. Verify the function returns a successful response
4. Check if the date extraction works with mock text

#### **2. Check Function Logs**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → validate-rif-expiration
3. Check the Logs tab
4. Look for "MOCK OCR EXTRACTION START" logs

#### **3. Verify Date Extraction**
1. Check if the mock text contains "FECHA DE VENCIMIENTO: 31/12/2025"
2. Verify the date extraction patterns work
3. Confirm the expiration date is correctly parsed

### Expected Results

#### **If Mock OCR Works:**
- **Function returns 200 status** instead of 500
- **Date extraction works** with mock text
- **Response contains valid expiration date**
- **Issue is confirmed to be with Tesseract.js**

#### **If Mock OCR Still Fails:**
- **Function still returns 500 status**
- **Issue is not with Tesseract.js**
- **Problem is elsewhere in the function**

### Next Steps Based on Results

#### **If Mock OCR Works:**
1. **Tesseract.js is the issue** - Need to fix Tesseract.js integration
2. **Consider alternative OCR solutions** - Use different OCR library
3. **Implement proper Tesseract.js** - Fix the Tesseract.js configuration

#### **If Mock OCR Still Fails:**
1. **Issue is not with Tesseract.js** - Problem is elsewhere
2. **Check function deployment** - Verify function is properly deployed
3. **Check other dependencies** - Look for other issues in the function

### Troubleshooting

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
1. Test the `/test` endpoint to verify function is working
2. Check if basic functionality works
3. Verify CORS and basic request handling

This mock OCR implementation should help identify if Tesseract.js is causing the 500 Internal Server Error!
