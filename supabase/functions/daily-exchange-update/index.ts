// Daily exchange rate update function - can be called by external cron services
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily exchange rate update...');

    // Fetch from Fawaz Ahmed Currency API with fallback
    let apiResponse;
    let apiData;
    
    // Primary URL (jsdelivr CDN)
    try {
      apiResponse = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
      apiData = await apiResponse.json();
    } catch (primaryError) {
      console.log('Primary API failed, trying fallback...', primaryError);
      // Fallback URL (Cloudflare)
      apiResponse = await fetch('https://latest.currency-api.pages.dev/v1/currencies/usd.json');
      apiData = await apiResponse.json();
    }
    
    if (!apiData?.usd?.ves) {
      throw new Error(`API response invalid: ${JSON.stringify(apiData)}`);
    }

    const rate = Number(apiData.usd.ves);
    const asOfDate = new Date().toISOString().slice(0, 10);
    
    console.log(`Fetched USD/VES rate: ${rate} for date: ${asOfDate}`);

    // Insert/update the rate in the database
    const { error } = await supabase
      .from('exchange_rates')
      .upsert({ 
        as_of_date: asOfDate, 
        usd_to_ves: rate, 
        source: 'fawaz-currency-api-daily' 
      }, { 
        onConflict: 'as_of_date' 
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully updated exchange rate: ${rate} VES per USD`);

    return new Response(JSON.stringify({ 
      success: true, 
      rate, 
      asOfDate,
      source: 'fawaz-currency-api-daily',
      message: 'Exchange rate updated successfully'
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });

  } catch (error) {
    console.error('Error updating exchange rate:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: String(error),
      message: 'Failed to update exchange rate'
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });
  }
});
