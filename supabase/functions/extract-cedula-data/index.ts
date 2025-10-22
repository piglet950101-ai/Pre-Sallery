import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OCR processing function with fallback
async function extractTextFromFile(fileContent: string, fileType: string) {
  try {
    // Try Space OCR API first
    const spaceApiKey = Deno.env.get('SPACE_API_KEY');
    if (spaceApiKey) {
      const formData = new FormData();
      
      // Convert base64 to blob
      const binaryString = atob(fileContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: fileType });
      formData.append('file', blob, 'document');
      
      const response = await fetch('https://api.space.com/v1/ocr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${spaceApiKey}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.text || '';
      }
    }
  } catch (error) {
    // Space OCR API failed, trying fallback
  }
  
  // Fallback: Use Google Cloud Vision API if available
  try {
    const googleApiKey = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (googleApiKey) {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            image: {
              content: fileContent
            },
            features: [{
              type: 'TEXT_DETECTION',
              maxResults: 1
            }]
          }]
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.responses && result.responses[0] && result.responses[0].textAnnotations) {
          return result.responses[0].textAnnotations[0].description || '';
        }
      }
    }
  } catch (error) {
    // Google Vision API failed
  }
  
  // Final fallback: Return empty string and let the client handle it
  return '';
}

// Extract cedula number from text
function extractCedulaNumber(text: string): string | null {
  // Remove extra whitespace and normalize
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Patterns for Venezuelan cedula numbers (V/E followed by 6-8 digits)
  const cedulaPatterns = [
    // Standard patterns with spaces and dots
    /(?:CÉDULA|CEDULA|C\.I\.|CI)[:\s]*([VE]\s*\d{1,3}\.?\d{1,3}\.?\d{1,3})/i,
    /(?:IDENTIFICACIÓN|IDENTIFICACION)[:\s]*([VE]\s*\d{1,3}\.?\d{1,3}\.?\d{1,3})/i,
    /(?:NÚMERO|NUMERO|N°|Nº)[:\s]*(?:DE\s+)?(?:CÉDULA|CEDULA|C\.I\.|CI)[:\s]*([VE]\s*\d{1,3}\.?\d{1,3}\.?\d{1,3})/i,
    
    // Direct patterns with spaces and dots
    /([VE]\s*\d{1,3}\.?\d{1,3}\.?\d{1,3})/,
    
    // Patterns without spaces/dots (fallback)
    /([VE]\d{6,8})/,
  ];
  
  for (const pattern of cedulaPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      let cedulaNumber = match[1] || match[0];
      
      // Clean up the cedula number (remove spaces and dots, keep V/E and digits)
      cedulaNumber = cedulaNumber.replace(/[^\dVE]/g, '');
      
      // Validate format (V/E followed by 6-8 digits)
      if (/^[VE]\d{6,8}$/.test(cedulaNumber)) {
        return cedulaNumber;
      }
      
      // Also try to handle cases where V/E might be separated
      const withoutPrefix = cedulaNumber.replace(/^[VE]/, '');
      if (/^\d{6,8}$/.test(withoutPrefix)) {
        return 'V' + withoutPrefix; // Default to V if not specified
      }
    }
  }
  
  return null;
}

// Extract expiration date from text
function extractExpirationDate(text: string): Date | null {
  // Remove extra whitespace and normalize
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Patterns for expiration date
  const expirationPatterns = [
    // Standard patterns with MM/YYYY format
    /(?:FECHA\s+(?:DE\s+)?VENCIMIENTO|VENCIMIENTO|VIGENCIA)[:\s]*(\d{1,2}[\/\-\.,]\d{4})/i,
    /(?:FECHA\s+(?:DE\s+)?EXPIRACIÓN|EXPIRACIÓN|EXPIRACION)[:\s]*(\d{1,2}[\/\-\.,]\d{4})/i,
    /(?:VÁLIDA\s+HASTA|VALIDA\s+HASTA)[:\s]*(\d{1,2}[\/\-\.,]\d{4})/i,
    
    // MM/YYYY format patterns
    /(\d{1,2}[\/\-\.,]\d{4})/,
    
    // Standard DD/MM/YYYY patterns (fallback)
    /(?:FECHA\s+(?:DE\s+)?VENCIMIENTO|VENCIMIENTO|VIGENCIA)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
    /(?:FECHA\s+(?:DE\s+)?EXPIRACIÓN|EXPIRACIÓN|EXPIRACION)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
    /(?:VÁLIDA\s+HASTA|VALIDA\s+HASTA)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
    
    // More flexible patterns
    /(?:VENCIMIENTO|VIGENCIA|EXPIRACIÓN|EXPIRACION)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
    /(?:VÁLIDA|VALIDA)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
    
    // OCR error handling patterns
    /(?:VENCIMIENTO|VIGENCIA)[:\s]*(\d{1,2}[\/\-\.,]\d{1,2}[\/\-\.,]\d{4})/i,
  ];
  
  for (const pattern of expirationPatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      const dateStr = match[1];
      const date = parseVenezuelanDate(dateStr);
      if (date && isValidDate(date)) {
        return date;
      }
    }
  }
  
  return null;
}

// Parse Venezuelan date formats
function parseVenezuelanDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Clean up the date string
  let cleanedDate = dateStr.replace(/[^\d\/\-\.,]/g, '');
  
  // Handle different separators
  cleanedDate = cleanedDate.replace(/[\/\-\.,]/g, '/');
  
  // Try to parse as DD/MM/YYYY
  const parts = cleanedDate.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      return new Date(year, month - 1, day);
    }
  }
  
  // Try to parse as MM/YYYY (for expiration dates)
  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    
    if (month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
      // Set to last day of the month for expiration date
      return new Date(year, month, 0); // Last day of the month
    }
  }
  
  return null;
}

// Validate date
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file_content, file_type } = await req.json();
    
    if (!file_content || !file_type) {
      return new Response(JSON.stringify({
        success: false,
        error: "Missing required parameters",
        message: "Faltan parámetros requeridos"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Validate file type
    if (!file_type.startsWith('image/') && file_type !== 'application/pdf') {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid file type",
        message: "Tipo de archivo inválido. Solo se permiten imágenes y PDFs."
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Extract text using OCR
    let extractedText;
    try {
      extractedText = await extractTextFromFile(file_content, file_type);
    } catch (ocrError) {
      // Return partial success instead of complete failure
      return new Response(JSON.stringify({
        success: true,
        cedula_number: null,
        expiration_date: null,
        is_expired: false,
        extracted_text: '',
        message: 'OCR no disponible. Los datos se pueden ingresar manualmente.',
        debug_info: {
          ocr_error: ocrError.message,
          ocr_available: false,
          fallback_used: true
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // If OCR returns empty text, still return success but with null values
    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(JSON.stringify({
        success: true,
        cedula_number: null,
        expiration_date: null,
        is_expired: false,
        extracted_text: '',
        message: 'OCR no disponible. Los datos se pueden ingresar manualmente.',
        debug_info: {
          ocr_available: false,
          fallback_used: true
        }
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    
    // Extract cedula number and expiration date
    const cedulaNumber = extractCedulaNumber(extractedText);
    const expirationDate = extractExpirationDate(extractedText);
    
    // Check if cedula is expired
    const isExpired = expirationDate ? expirationDate < new Date() : null;
    
    
    return new Response(JSON.stringify({
      success: true,
      cedula_number: cedulaNumber,
      expiration_date: expirationDate ? expirationDate.toISOString() : null,
      is_expired: isExpired,
      extracted_text: extractedText,
      message: cedulaNumber 
        ? `Cédula ${cedulaNumber} ${isExpired ? 'vencida' : 'válida'}`
        : 'No se pudo extraer el número de cédula'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Internal server error",
      message: "Error interno del servidor",
      debug_info: {
        error_message: error.message,
        error_type: error.constructor.name
      }
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    });
  }
});
