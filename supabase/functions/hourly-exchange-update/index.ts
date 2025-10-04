// Hourly exchange rate update function for real-time rates
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

    console.log('Starting hourly exchange rate update...');

    // Check if we already have a rate for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('usd_to_ves, source, updated_at')
      .eq('as_of_date', today)
      .maybeSingle();

    // If we have a manual rate for today, don't override it
    if (existingRate && existingRate.source === 'manual') {
      console.log('Manual rate exists for today, skipping automatic update');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Manual rate exists, skipping update',
        rate: existingRate.usd_to_ves,
        source: existingRate.source
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...cors() } 
      });
    }

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
    
    console.log(`Fetched USD/VES rate: ${rate} for date: ${today}`);

    // Delete existing rate for today and insert new one to update timestamp
    await supabase
      .from('exchange_rates')
      .delete()
      .eq('as_of_date', today);

    // Insert the new rate (this will set created_at to current timestamp)
    const { error } = await supabase
      .from('exchange_rates')
      .insert({ 
        as_of_date: today, 
        usd_to_ves: rate, 
        source: 'fawaz-currency-api-hourly' 
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully updated exchange rate: ${rate} VES per USD`);

    return new Response(JSON.stringify({ 
      success: true, 
      rate, 
      asOfDate: today,
      source: 'fawaz-currency-api-hourly',
      message: 'Exchange rate updated successfully',
      previousRate: existingRate?.usd_to_ves || null
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
