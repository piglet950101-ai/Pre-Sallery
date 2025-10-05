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
