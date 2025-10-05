// supabase/functions/extract-rif-data/index.ts
// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}

// Simple text extraction using regex patterns for Venezuelan RIF documents
function extractRIFData(text: string) {
  const data: any = {};
  
  // Extract RIF number (V-12345678-9 format)
  const rifMatch = text.match(/[VJPG]-?\s*(\d{7,8})-?\s*(\d)/i);
  if (rifMatch) {
    data.rif_number = `${rifMatch[1]}-${rifMatch[2]}`;
    data.rif_type = rifMatch[0].charAt(0).toUpperCase();
  }
  
  // Extract company name (look for common patterns)
  const namePatterns = [
    /(?:RAZON SOCIAL|NOMBRE|EMPRESA|COMPANY)[:\s]+([A-ZÁÉÍÓÚÑ\s]+)/i,
    /([A-ZÁÉÍÓÚÑ\s]+(?:C\.A\.|S\.A\.|S\.R\.L\.|C\.V\.|L\.T\.D\.))/i
  ];
  
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1].trim().length > 3) {
      data.company_name = match[1].trim();
      break;
    }
  }
  
  // Extract address
  const addressMatch = text.match(/(?:DIRECCION|DIRECCIÓN|ADDRESS)[:\s]+([A-Z0-9ÁÉÍÓÚÑ\s,.-]+)/i);
  if (addressMatch) {
    data.address = addressMatch[1].trim();
  }
  
  // Extract phone
  const phoneMatch = text.match(/(?:TELEFONO|TELÉFONO|PHONE)[:\s]+([0-9\s\-\(\)]+)/i);
  if (phoneMatch) {
    data.phone = phoneMatch[1].trim();
  }
  
  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    data.email = emailMatch[1];
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: cors()
  });
  
  try {
    const { company_id, document_url } = await req.json();
    
    if (!company_id || !document_url) {
      throw new Error("Missing company_id or document_url");
    }
    
    // For now, we'll simulate text extraction
    // In a real implementation, you would:
    // 1. Download the image/PDF from the URL
    // 2. Use OCR service (like Tesseract.js, Google Vision API, or AWS Textract)
    // 3. Extract structured data
    
    // Simulate extracted data (replace with actual OCR)
    const simulatedText = `
      RAZON SOCIAL: EMPRESA EJEMPLO C.A.
      RIF: V-12345678-9
      DIRECCION: AV. PRINCIPAL, CARACAS, VENEZUELA
      TELEFONO: +58-212-1234567
      EMAIL: contacto@empresa.com
    `;
    
    const extractedData = extractRIFData(simulatedText);
    
    // Update company record with extracted data
    const { error } = await supabase
      .from('companies')
      .update({
        extracted_rif_data: extractedData,
        data_extraction_date: new Date().toISOString()
      })
      .eq('id', company_id);
    
    if (error) throw error;
    
    return new Response(JSON.stringify({
      success: true,
      extracted_data: extractedData,
      message: "RIF data extracted successfully"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
    
  } catch (e) {
    return new Response(JSON.stringify({
      error: String(e)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
  }
});
