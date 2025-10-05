# RIF Validation Error Handling Guide

## Issue: 500 Internal Server Error

### Problem Description
The Edge Function is returning a 500 Internal Server Error, which means there's an error in the server-side code that's causing the function to crash.

### Enhanced Error Handling Added

#### **1. Request Parsing Error Handling**
```typescript
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
```

#### **2. OCR Processing Error Handling**
```typescript
let extractedText;
try {
  extractedText = await extractTextFromFile(file_content, file_type);
  console.log('OCR extraction completed, text length:', extractedText ? extractedText.length : 0);
  console.log('=== OCR PROCESSING COMPLETED ===');
} catch (ocrError) {
  console.error('OCR extraction failed:', ocrError);
  console.error('OCR error details:', {
    message: ocrError.message,
    stack: ocrError.stack,
    name: ocrError.name
  });
  
  return new Response(JSON.stringify({
    success: false,
    error: "OCR processing failed",
    message: file_type === 'application/pdf' 
      ? "Error al procesar el documento PDF. Asegúrate de que el PDF contenga texto legible y no esté escaneado como imagen. Para documentos españoles, verifica que contenga información de vencimiento o caducidad."
      : "Error al procesar la imagen. Asegúrate de que la imagen sea clara, esté bien iluminada y el texto sea legible. Para documentos españoles, verifica que contenga información de vencimiento o caducidad.",
    file_type: file_type,
    request_id: requestId,
    processing_timestamp: new Date().toISOString()
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}
```

#### **3. Date Extraction Error Handling**
```typescript
let expirationDate;
try {
  expirationDate = extractExpirationDate(extractedText);
  console.log('Date extraction result:', expirationDate);
  console.log('=== DATE EXTRACTION COMPLETED ===');
} catch (dateError) {
  console.error('Date extraction failed:', dateError);
  console.error('Date error details:', {
    message: dateError.message,
    stack: dateError.stack,
    name: dateError.name
  });
  
  return new Response(JSON.stringify({
    success: false,
    error: "Date extraction failed",
    message: "Error al extraer la fecha de vencimiento del documento. Verifica que el documento contenga información de vencimiento o caducidad.",
    file_type: file_type,
    request_id: requestId,
    processing_timestamp: new Date().toISOString()
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}
```

#### **4. Global Error Handling**
```typescript
} catch (error) {
  console.error('=== RIF VALIDATION ERROR ===');
  console.error('Error type:', error.constructor.name);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
  console.error('Full error object:', error);
  
  // Try to get request ID if available
  let requestId = 'unknown';
  try {
    const requestBody = await req.json();
    requestId = Math.random().toString(36).substring(7);
  } catch (e) {
    // Ignore JSON parsing errors
  }
  
  return new Response(JSON.stringify({
    success: false,
    error: "Internal server error",
    message: "Error interno del servidor. Intenta nuevamente.",
    request_id: requestId,
    processing_timestamp: new Date().toISOString(),
    error_details: {
      type: error.constructor.name,
      message: error.message
    }
  }), {
    status: 500,
    headers: {
      "Content-Type": "application/json",
      ...cors()
    }
  });
}
```

### What You'll See in Logs

#### **1. Request Parsing Errors**
```
=== EDGE FUNCTION START ===
Request method: POST
Request URL: https://pwlfihzqpgixswmqyjvw.supabase.co/functions/v1/validate-rif-expiration
Request headers: { "content-type": "application/json", "authorization": "Bearer ..." }
Failed to parse request body: SyntaxError: Unexpected token in JSON at position 0
```

#### **2. OCR Processing Errors**
```
=== STARTING OCR PROCESSING ===
File content length: 245760
File type: application/pdf
Base64 preview: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=...
OCR extraction failed: Error: Tesseract.js failed to initialize
OCR error details: {
  message: "Tesseract.js failed to initialize",
  stack: "Error: Tesseract.js failed to initialize\n    at createWorker...",
  name: "Error"
}
```

#### **3. Date Extraction Errors**
```
=== STARTING DATE EXTRACTION ===
Extracted text for date extraction: REINO DE ESPAÑA
MINISTERIO DE HACIENDA
AGENCIA TRIBUTARIA
CERTIFICADO DE IDENTIFICACION FISCAL
NIF: 12345678A
NOMBRE: EMPRESA EJEMPLO S.L.
DIRECCION: CALLE PRINCIPAL, 123
MADRID, 28001
FECHA DE EXPIRACION: 31/12/2025
VIGENCIA: 2023-2025
CERTIFICADO EMITIDO POR LA AGENCIA TRIBUTARIA
...
Extracted text length for date extraction: 1247
Date extraction failed: Error: Invalid date format
Date error details: {
  message: "Invalid date format",
  stack: "Error: Invalid date format\n    at parseVenezuelanDate...",
  name: "Error"
}
```

#### **4. Global Errors**
```
=== RIF VALIDATION ERROR ===
Error type: ReferenceError
Error message: Cannot access 'worker' before initialization
Error stack: ReferenceError: Cannot access 'worker' before initialization
    at extractTextFromFile (file:///workspace/index.ts:45:5)
    at serve (file:///workspace/index.ts:677:11)
    at async serve (file:///workspace/index.ts:557:1)
Full error object: ReferenceError: Cannot access 'worker' before initialization
    at extractTextFromFile (file:///workspace/index.ts:45:5)
    at serve (file:///workspace/index.ts:677:11)
    at async serve (file:///workspace/index.ts:557:1)
```

### Enhanced Error Responses

#### **1. Request Parsing Error Response**
```json
{
  "success": false,
  "error": "Invalid JSON in request body",
  "message": "Error al procesar la solicitud. Verifica que los datos sean válidos."
}
```

#### **2. OCR Processing Error Response**
```json
{
  "success": false,
  "error": "OCR processing failed",
  "message": "Error al procesar el documento PDF. Asegúrate de que el PDF contenga texto legible y no esté escaneado como imagen. Para documentos españoles, verifica que contenga información de vencimiento o caducidad.",
  "file_type": "application/pdf",
  "request_id": "abc123",
  "processing_timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### **3. Date Extraction Error Response**
```json
{
  "success": false,
  "error": "Date extraction failed",
  "message": "Error al extraer la fecha de vencimiento del documento. Verifica que el documento contenga información de vencimiento o caducidad.",
  "file_type": "application/pdf",
  "request_id": "abc123",
  "processing_timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### **4. Global Error Response**
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error interno del servidor. Intenta nuevamente.",
  "request_id": "abc123",
  "processing_timestamp": "2024-01-15T10:30:45.123Z",
  "error_details": {
    "type": "ReferenceError",
    "message": "Cannot access 'worker' before initialization"
  }
}
```

### Troubleshooting Steps

#### **1. Check Request Format**
- **Issue**: Invalid JSON in request body
- **Solution**: Verify the request is properly formatted
- **Check**: Look for "Failed to parse request body" in logs

#### **2. Check OCR Processing**
- **Issue**: Tesseract.js initialization or processing failure
- **Solution**: Check if the file is valid and readable
- **Check**: Look for "OCR extraction failed" in logs

#### **3. Check Date Extraction**
- **Issue**: Date parsing or extraction failure
- **Solution**: Verify the document contains expiration information
- **Check**: Look for "Date extraction failed" in logs

#### **4. Check Global Errors**
- **Issue**: Unexpected errors in the function
- **Solution**: Check the error details and stack trace
- **Check**: Look for "RIF VALIDATION ERROR" in logs

### Next Steps

1. **Upload the PDF again** and check the browser console for detailed error information
2. **Check Supabase logs** for the specific error that's causing the 500 status
3. **Identify the error type** using the enhanced error handling
4. **Report the specific error** based on the logs

The enhanced error handling should now provide detailed information about exactly what's causing the 500 Internal Server Error, allowing us to identify and fix the specific issue!
