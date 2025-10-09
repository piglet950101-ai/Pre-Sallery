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

    

    // Check if we already have a rate for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('usd_to_ves, source, updated_at')
      .eq('as_of_date', today)
      .maybeSingle();

    // If we have a manual rate for today, don't override it
    if (existingRate && existingRate.source === 'manual') {
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

    // Fetch from BCV API only; skip update if it fails
    let rate: number | null = null;
    const sourceVal = 'bcv-api-hourly';
    try {
      const apiResponse = await fetch('https://bcv-api.rafnixg.dev/rates/', { headers: { 'accept': 'application/json' } });
      const apiData: any = await apiResponse.json();
      const parsedRate = (
        typeof apiData?.dollar === 'number' ? apiData.dollar :
        typeof apiData?.rate === 'number' ? apiData.rate :
        typeof apiData?.usd_to_ves === 'number' ? apiData.usd_to_ves :
        typeof apiData?.usd?.ves === 'number' ? apiData.usd.ves :
        typeof apiData?.usd?.value === 'number' ? apiData.usd.value :
        null
      );
      if (parsedRate != null) {
        rate = Number(parsedRate);
      } else {
        throw new Error(`BCV API response invalid: ${JSON.stringify(apiData)}`);
      }
    } catch (bcvError) {
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: 'Skipped update: BCV API unavailable or invalid response',
        error: String(bcvError)
      }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
    }
    
    

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
        source: sourceVal 
      });

    if (error) {
      throw error;
    }

    

    return new Response(JSON.stringify({ 
      success: true, 
      rate, 
      asOfDate: today,
      source: sourceVal,
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
