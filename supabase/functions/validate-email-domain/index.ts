// Deno edge function to validate email domain via DNS MX lookup
// Returns hasMx=true when MX records are present for the domain

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({ error: "Expected application/json body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({} as any));
    const email: string | undefined = body?.email;
    const domainInput: string | undefined = body?.domain;

    const domain = (domainInput || (email && email.split("@")[1]) || "").trim().toLowerCase();
    if (!domain) {
      return new Response(JSON.stringify({ error: "Missing domain" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let hasMx = false;
    let mx: unknown = [];
    try {
      mx = await Deno.resolveDns(domain, "MX");
      hasMx = Array.isArray(mx) && (mx as unknown[]).length > 0;
    } catch (_err) {
      // If MX lookup fails, try A record as a fallback (some providers omit MX but accept mail)
      try {
        const a = await Deno.resolveDns(domain, "A");
        hasMx = Array.isArray(a) && a.length > 0;
        mx = [];
      } catch (_err2) {
        hasMx = false;
      }
    }

    return new Response(
      JSON.stringify({ domain, hasMx }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


