# RIF Validation Logs Guide

## Browser Console Logs (Client-Side)

When you upload a RIF document, you'll now see detailed logs in your browser console:

### 1. Open Browser Developer Tools
- **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
- **Firefox**: Press `F12` or `Ctrl+Shift+I`
- **Safari**: Press `Cmd+Option+I`

### 2. Go to Console Tab
- Click on the "Console" tab in the developer tools

### 3. Upload a RIF Document
- Go to company registration or employee registration
- Upload a RIF image/PDF
- Watch the console for logs

### 4. What You'll See in Browser Console

```
=== RIF VALIDATION CLIENT SIDE ===
File name: rif-document.jpg
File size: 245760 bytes
File type: image/jpeg
Base64 length: 327680

=== RIF VALIDATION RESPONSE ===
Error: null
Data: {
  success: true,
  is_expired: false,
  expiration_date: "2025-12-31T00:00:00.000Z",
  days_until_expiration: 350,
  extracted_text: "REPUBLICA BOLIVARIANA DE VENEZUELA\nSENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA\nREGISTRO DE INFORMACION FISCAL (RIF)\n\nDATOS DEL CONTRIBUYENTE\nRIF: J-12345678-9\nNOMBRE: EMPRESA EJEMPLO C.A.\nDIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA\nTELEFONO: (0212) 123-4567\n\nFECHA DE VENCIMIENTO: 31/12/2025\nVIGENCIA: 2023-2025\n\nEste documento es válido hasta la fecha de vencimiento indicada....",
  message: "El documento RIF es válido hasta 31/12/2025"
}

=== EXTRACTED RIF DATA ===
Success: true
Is expired: false
Expiration date: 2025-12-31T00:00:00.000Z
Days until expiration: 350
Extracted text preview: REPUBLICA BOLIVARIANA DE VENEZUELA
SENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
REGISTRO DE INFORMACION FISCAL (RIF)

DATOS DEL CONTRIBUYENTE
RIF: J-12345678-9
NOMBRE: EMPRESA EJEMPLO C.A.
DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
TELEFONO: (0212) 123-4567

FECHA DE VENCIMIENTO: 31/12/2025
VIGENCIA: 2023-2025

Este documento es válido hasta la fecha de vencimiento indicada....
Message: El documento RIF es válido hasta 31/12/2025
=== END EXTRACTED DATA ===

✅ RIF document is valid
```

## Supabase Server Logs (Server-Side)

For more detailed server-side logs, you can view them in the Supabase dashboard:

### 1. Go to Supabase Dashboard
- Visit [supabase.com](https://supabase.com)
- Sign in to your account
- Select your project

### 2. Navigate to Edge Functions
- In the left sidebar, click on "Edge Functions"
- Find the "validate-rif-expiration" function

### 3. View Logs
- Click on the function name
- Go to the "Logs" tab
- You'll see detailed server-side logs including:
  - OCR processing steps
  - Text extraction details
  - Date parsing attempts
  - Pattern matching results

### 4. What You'll See in Server Logs

```
=== RIF VALIDATION REQUEST START ===
File type: image/jpeg
File content length: 245760
Base64 preview: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=...
✅ File type validation passed
=== STARTING OCR PROCESSING ===
=== RIF OCR EXTRACTION START ===
File type: image/jpeg
Content length: 245760
Base64 preview: /9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=...
Tesseract worker configured successfully
Buffer size: 184320 bytes
OCR Progress: 25%
OCR Progress: 50%
OCR Progress: 75%
OCR Progress: 100%
=== OCR EXTRACTION COMPLETED ===
Extracted text length: 1247
Extracted text preview (first 500 chars):
REPUBLICA BOLIVARIANA DE VENEZUELA
SENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
REGISTRO DE INFORMACION FISCAL (RIF)

DATOS DEL CONTRIBUYENTE
RIF: J-12345678-9
NOMBRE: EMPRESA EJEMPLO C.A.
DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
TELEFONO: (0212) 123-4567

FECHA DE VENCIMIENTO: 31/12/2025
VIGENCIA: 2023-2025

Este documento es válido hasta la fecha de vencimiento indicada.
=== FULL EXTRACTED TEXT ===
REPUBLICA BOLIVARIANA DE VENEZUELA
SENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
REGISTRO DE INFORMACION FISCAL (RIF)

DATOS DEL CONTRIBUYENTE
RIF: J-12345678-9
NOMBRE: EMPRESA EJEMPLO C.A.
DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
TELEFONO: (0212) 123-4567

FECHA DE VENCIMIENTO: 31/12/2025
VIGENCIA: 2023-2025

Este documento es válido hasta la fecha de vencimiento indicada.
=== END EXTRACTED TEXT ===
=== RIF OCR EXTRACTION END ===
=== OCR PROCESSING COMPLETED ===
=== STARTING DATE EXTRACTION ===
=== DATE EXTRACTION START ===
Input text length: 1247
Text preview (first 300 chars): REPUBLICA BOLIVARIANA DE VENEZUELA
SENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA
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
Testing Venezuelan RIF patterns...
Testing Venezuelan pattern 1: /(?:FECHA\s+DE\s+VENCIMIENTO|FECHA\s+VENCIMIENTO)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i
Pattern 1 matches: ["FECHA DE VENCIMIENTO: 31/12/2025", "31/12/2025"]
Found potential date string: "31/12/2025"
=== PARSING DATE: "31/12/2025" ===
Cleaned date string: "31/12/2025"
Trying separator: "/"
Split parts: ["31", "12", "2025"]
Parsed components: day=31, month=12, year=2025
Validation: day=true, month=true, year=true
Created date object: 2025-12-31T00:00:00.000Z
Date ISO string: 2025-12-31T00:00:00.000Z
✅ Valid date created successfully
✅ Found valid Venezuelan RIF expiration date: 31/12/2025 -> 2025-12-31T00:00:00.000Z
=== DATE EXTRACTION SUCCESS ===
=== DATE EXTRACTION COMPLETED ===
✅ Expiration date found: 2025-12-31T00:00:00.000Z
Date ISO string: 2025-12-31T00:00:00.000Z
Date local string: 31/12/2025
=== CHECKING RIF EXPIRATION ===
Today (normalized): 2024-01-15T00:00:00.000Z
Expiration date (normalized): 2025-12-31T00:00:00.000Z
Is expired (expDate < today): false
Final expiration status: false
=== EXPIRATION CHECK ===
Is expired: false
Days until expiration: 350
Current date: 2024-01-15T10:30:45.123Z
Expiration date: 2025-12-31T00:00:00.000Z
=== RIF VALIDATION SUCCESS ===
Response data: {
  "success": true,
  "is_expired": false,
  "expiration_date": "2025-12-31T00:00:00.000Z",
  "days_until_expiration": 350,
  "extracted_text": "REPUBLICA BOLIVARIANA DE VENEZUELA\nSENIAT - SERVICIO NACIONAL INTEGRADO DE ADMINISTRACION TRIBUTARIA\nREGISTRO DE INFORMACION FISCAL (RIF)\n\nDATOS DEL CONTRIBUYENTE\nRIF: J-12345678-9\nNOMBRE: EMPRESA EJEMPLO C.A.\nDIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA\nTELEFONO: (0212) 123-4567\n\nFECHA DE VENCIMIENTO: 31/12/2025\nVIGENCIA: 2023-2025\n\nEste documento es válido hasta la fecha de vencimiento indicada....",
  "message": "El documento RIF es válido hasta 31/12/2025"
}
```

## Troubleshooting

### If you don't see logs in browser console:
1. Make sure Developer Tools are open
2. Check that the Console tab is selected
3. Try refreshing the page and uploading again
4. Look for any error messages in red

### If you don't see server logs in Supabase:
1. Make sure you're looking at the correct function
2. Check that the function was deployed successfully
3. Try uploading a document to trigger the function
4. Look for any error messages in the logs

## Log Data Explained

### Client-Side Logs Show:
- **File Information**: Name, size, type, base64 length
- **API Response**: Success/error status, extracted data
- **Validation Results**: Expiration status, dates, messages

### Server-Side Logs Show:
- **OCR Processing**: Tesseract.js progress, text extraction
- **Pattern Matching**: Regex attempts, date string extraction
- **Date Parsing**: Component validation, date object creation
- **Expiration Check**: Date comparison, final validation

This comprehensive logging helps you understand exactly what data is being extracted from your RIF documents and how the validation process works!
