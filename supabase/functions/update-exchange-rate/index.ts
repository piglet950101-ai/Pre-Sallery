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
      // Fetch from BCV API (rafnixg); skip update if it fails
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
        if (parsedRate == null) {
          throw new Error(`BCV API response invalid: ${JSON.stringify(apiData)}`);
        }
        rate = Number(parsedRate);
        source = 'bcv-api';
        if (typeof apiData?.date === 'string') {
          asOfDate = apiData.date.slice(0, 10);
        }
      } catch (bcvError) {
        return new Response(JSON.stringify({
          success: true,
          skipped: true,
          message: 'Skipped update: BCV API unavailable or invalid response',
          error: String(bcvError)
        }), { status: 200, headers: { "Content-Type": "application/json", ...cors() } });
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


