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
