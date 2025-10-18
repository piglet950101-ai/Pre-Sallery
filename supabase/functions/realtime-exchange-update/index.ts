// Real-time exchange rate update function - updates every 15 minutes
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

    

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    
    // Check if we already have a manual rate for today
    const { data: existingRate } = await supabase
      .from('exchange_rates')
      .select('usd_to_ves, source, updated_at')
      .eq('as_of_date', today)
      .maybeSingle();

    // If we have a manual rate for today that's less than 1 hour old, don't override it
    if (existingRate && existingRate.source === 'manual') {
      const manualRateAge = now.getTime() - new Date(existingRate.updated_at).getTime();
      const oneHourMs = 60 * 60 * 1000;
      
      if (manualRateAge < oneHourMs) {
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Recent manual rate exists, skipping update',
          rate: existingRate.usd_to_ves,
          source: existingRate.source,
          skipped: true
        }), { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...cors() } 
        });
      }
    }

    // Fetch from BCV API only; skip update if it fails
    let rate: number | null = null;
    const source = 'bcv-api-realtime';
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
    
    

    // Check if rate has changed significantly (more than 0.1% from existing rate)
    let significantChange = true;
    if (existingRate) {
      const changePercent = Math.abs(rate - existingRate.usd_to_ves) / existingRate.usd_to_ves;
      significantChange = changePercent > 0.001; // 0.1% threshold
    }

    // Use upsert to properly handle updated_at timestamp
    const { error } = await supabase
      .from('exchange_rates')
      .upsert({ 
        as_of_date: today, 
        usd_to_ves: rate, 
        source: source,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'as_of_date' 
      });

    if (error) {
      throw error;
    }

    

    // Create notification for significant changes
    if (significantChange && existingRate) {
      const changePercent = ((rate - existingRate.usd_to_ves) / existingRate.usd_to_ves * 100).toFixed(5);
      const direction = rate > existingRate.usd_to_ves ? 'increased' : 'decreased';
      
      try {
        await supabase
          .from('notifications')
          .insert({
            type: 'exchange_rate_change',
            title: 'Exchange Rate Change Alert',
            message: `Exchange rate ${direction} by ${Math.abs(parseFloat(changePercent))}% from ${existingRate.usd_to_ves.toFixed(6)} to ${rate.toFixed(6)} VES per USD.`,
            severity: 'info',
            metadata: {
              previous_rate: existingRate.usd_to_ves,
              new_rate: rate,
              change_percent: parseFloat(changePercent),
              date: today,
              timestamp: now.toISOString()
            }
          });
      } catch (notificationError) {
        console.error('Failed to create change notification:', notificationError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      rate, 
      asOfDate: today,
      source: source,
      message: 'Real-time exchange rate updated successfully',
      previousRate: existingRate?.usd_to_ves || null,
      significantChange,
      changePercent: existingRate ? ((rate - existingRate.usd_to_ves) / existingRate.usd_to_ves * 100).toFixed(5) : null
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });

  } catch (error) {
    console.error('Error updating real-time exchange rate:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: String(error),
      message: 'Failed to update real-time exchange rate'
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });
  }
});
