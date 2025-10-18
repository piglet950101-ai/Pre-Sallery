import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting daily exchange rate check at 6:10 PM...");

    // Check current exchange rate status
    const { data: latestRate, error: rateError } = await supabase
      .from('exchange_rate_latest')
      .select('usd_to_ves, created_at, as_of_date, source')
      .maybeSingle();

    if (rateError) {
      console.error("Error fetching latest rate:", rateError);
      return new Response(JSON.stringify({
        success: false,
        message: "Failed to fetch current exchange rate",
        error: rateError.message
      }), { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...cors() } 
      });
    }

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours (1 day) threshold
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hours (2 days) for critical

    let status = {
      hasRateToday: false,
      isStale: false,
      lastUpdate: null,
      needsUpdate: false,
      severity: 'info'
    };

      if (latestRate) {
        const lastUpdate = new Date(latestRate.created_at || latestRate.as_of_date);
        status.hasRateToday = latestRate.as_of_date === today;
        status.isStale = lastUpdate < oneDayAgo;
        status.lastUpdate = latestRate.created_at || latestRate.as_of_date;
        status.needsUpdate = status.isStale || !status.hasRateToday;
        
        if (lastUpdate < twoDaysAgo) {
          status.severity = 'critical';
        } else if (status.isStale) {
          status.severity = 'warning';
        }
    } else {
      status.needsUpdate = true;
      status.severity = 'critical';
    }

    // If rate needs update, try to fetch from API
    if (status.needsUpdate) {
      console.log("Exchange rate needs update, fetching from API...");
      
      try {
        const apiResponse = await fetch('https://bcv-api.rafnixg.dev/rates/', { 
          headers: { 'accept': 'application/json' } 
        });
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
          const rate = Number(parsedRate);
          
          // Use upsert to properly handle updated_at timestamp
          const { error: upsertError } = await supabase
            .from('exchange_rates')
            .upsert({ 
              as_of_date: today, 
              usd_to_ves: rate, 
              source: 'bcv-api-daily-check',
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'as_of_date' 
            });

          if (upsertError) {
            console.error("Error upserting updated rate:", upsertError);
            throw upsertError;
          }

          console.log(`Successfully updated exchange rate to ${rate} VES`);
          
          // Create notification for successful update
          await supabase
            .from('notifications')
            .insert({
              type: 'exchange_rate_updated',
              title: 'Exchange Rate Updated',
              message: `Exchange rate updated to ${rate} VES at 6:10 PM daily check.`,
              severity: 'info',
              metadata: {
                rate: rate,
                source: 'bcv-api-daily-check',
                update_time: now.toISOString()
              }
            });

          return new Response(JSON.stringify({
            success: true,
            message: "Exchange rate updated successfully",
            rate: rate,
            previousRate: latestRate?.usd_to_ves || null,
            wasStale: status.isStale,
            wasMissing: !status.hasRateToday
          }), { 
            status: 200, 
            headers: { "Content-Type": "application/json", ...cors() } 
          });
        } else {
          throw new Error(`BCV API response invalid: ${JSON.stringify(apiData)}`);
        }
      } catch (apiError) {
        console.error("Failed to fetch from API:", apiError);
        
        // Create notification for failed update
        await supabase
          .from('notifications')
          .insert({
            type: 'exchange_rate_update_failed',
            title: 'Exchange Rate Update Failed',
            message: `Daily 6:10 PM exchange rate update failed. API unavailable or invalid response. Manual update may be required.`,
            severity: 'error',
            metadata: {
              error: String(apiError),
              check_time: now.toISOString(),
              previous_rate: latestRate?.usd_to_ves || null
            }
          });

        return new Response(JSON.stringify({
          success: false,
          message: "Failed to update exchange rate - API unavailable",
          error: String(apiError),
          currentRate: latestRate?.usd_to_ves || null,
          isStale: status.isStale
        }), { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...cors() } 
        });
      }
    } else {
      console.log("Exchange rate is current, no update needed");
      
      // Create notification that rate is current
      await supabase
        .from('notifications')
        .insert({
          type: 'exchange_rate_check',
          title: 'Exchange Rate Check Complete',
          message: `Daily 6:10 PM check completed. Rate is current (${latestRate.usd_to_ves} VES, updated ${status.lastUpdate}).`,
          severity: 'info',
          metadata: {
            rate: latestRate.usd_to_ves,
            last_update: status.lastUpdate,
            source: latestRate.source,
            check_time: now.toISOString()
          }
        });

      return new Response(JSON.stringify({
        success: true,
        message: "Exchange rate is current, no update needed",
        rate: latestRate.usd_to_ves,
        lastUpdate: status.lastUpdate,
        source: latestRate.source
      }), { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...cors() } 
      });
    }

  } catch (error) {
    console.error("Daily rate check error:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: "Daily exchange rate check failed",
      error: String(error)
    }), { 
      status: 500, 
      headers: { "Content-Type": "application/json", ...cors() } 
    });
  }
});
