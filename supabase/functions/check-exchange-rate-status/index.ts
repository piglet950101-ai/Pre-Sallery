// Function to check exchange rate status - simplified version
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

    console.log('Checking exchange rate status...');

    const today = new Date().toISOString().slice(0, 10);

    // Check if we have a rate for today from the latest view
    const { data: latestRate, error } = await supabase
      .from('exchange_rate_latest')
      .select('usd_to_ves, source, created_at, as_of_date')
      .maybeSingle();

    if (error) {
      console.error('Error fetching exchange rate:', error);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Failed to fetch exchange rate data',
        details: error.message
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...cors() } 
      });
    }

    // Calculate status
    const hasRateToday = latestRate && latestRate.as_of_date === today;
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours for reasonable threshold
    const lastUpdate = latestRate?.created_at || null;
    const isStale = !lastUpdate || new Date(lastUpdate) < fourHoursAgo;

    console.log(`Rate status: hasRateToday=${hasRateToday}, isStale=${isStale}, rate=${latestRate?.usd_to_ves}`);

    return new Response(JSON.stringify({ 
      success: true,
      status: {
        hasRateToday,
        isStale,
        lastUpdate,
        source: latestRate?.source || null,
        rate: latestRate?.usd_to_ves || null
      },
      latestRate,
      message: !hasRateToday ? 'No exchange rate for today' : 
               isStale ? 'Exchange rate is stale' : 
               'Exchange rate status is good'
    }), { 
      status: 200, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });

  } catch (error) {
    console.error('Error checking exchange rate status:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: String(error),
      message: 'Failed to check exchange rate status'
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });
  }
});
