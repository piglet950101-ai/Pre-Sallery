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

    console.log('Starting real-time exchange rate update...');

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
        console.log('Recent manual rate exists, skipping automatic update');
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

    // Check if rate has changed significantly (more than 0.1% from existing rate)
    let significantChange = true;
    if (existingRate) {
      const changePercent = Math.abs(rate - existingRate.usd_to_ves) / existingRate.usd_to_ves;
      significantChange = changePercent > 0.001; // 0.1% threshold
    }

    // Insert/update the rate in the database
    const { error } = await supabase
      .from('exchange_rates')
      .upsert({ 
        as_of_date: today, 
        usd_to_ves: rate, 
        source: 'fawaz-currency-api-realtime' 
      }, { 
        onConflict: 'as_of_date' 
      });

    if (error) {
      throw error;
    }

    console.log(`Successfully updated exchange rate: ${rate} VES per USD`);

    // Create notification for significant changes
    if (significantChange && existingRate) {
      const changePercent = ((rate - existingRate.usd_to_ves) / existingRate.usd_to_ves * 100).toFixed(2);
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
      source: 'fawaz-currency-api-realtime',
      message: 'Real-time exchange rate updated successfully',
      previousRate: existingRate?.usd_to_ves || null,
      significantChange,
      changePercent: existingRate ? ((rate - existingRate.usd_to_ves) / existingRate.usd_to_ves * 100).toFixed(2) : null
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
