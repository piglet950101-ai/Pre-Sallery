// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Allow manual override via POST body { rate, asOfDate }
    let body: any = {};
    try { body = await req.json(); } catch {}

    let rate: number | null = typeof body?.rate === 'number' ? body.rate : null;
    let asOfDate: string = body?.asOfDate || new Date().toISOString().slice(0,10);
    let source = 'auto';

    if (!rate) {
      // Fetch from Fawaz Ahmed Currency API with fallback
      try {
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
        
        if (apiData?.usd?.ves) {
          rate = Number(apiData.usd.ves);
          source = 'fawaz-currency-api';
          console.log(`Fetched USD/VES rate: ${rate} from Fawaz Currency API`);
        } else {
          throw new Error(`API response invalid: ${JSON.stringify(apiData)}`);
        }
      } catch (fetchError) {
        console.error('Failed to fetch from Currency API:', fetchError);
        return new Response(JSON.stringify({ 
          error: 'Failed to fetch exchange rate from API', 
          details: String(fetchError) 
        }), { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...cors() } 
        });
      }
    } else {
      source = body?.source || 'manual';
    }

    // Delete existing rate for the date and insert new one to update timestamp
    await supabase
      .from('exchange_rates')
      .delete()
      .eq('as_of_date', asOfDate);

    // Insert the new rate (this will set created_at to current timestamp)
    const { error } = await supabase
      .from('exchange_rates')
      .insert({ as_of_date: asOfDate, usd_to_ves: rate, source });
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, asOfDate, rate }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json", ...cors() } });
  }
});


