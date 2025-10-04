// supabase/functions/send-company-activated-email/index.ts
// deno-lint-ignore-file
// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };
}
async function sendResend({ to, subject, html }) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "onboarding@resend.dev",
      to: [
        // to
        'novanoodle7@gmail.com'
      ],
      subject,
      html
    })
  });
  if (!resp.ok) throw new Error(`Resend error ${resp.status}: ${await resp.text()}`);
}
serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: cors()
  });
  try {
    const { to, subject, companyName, message } = await req.json();
    if (!to) throw new Error("Missing 'to' email");
    const html = `
      <div>
        <h2>${subject}</h2>
        <p>${message}</p>
        <p><strong>Company:</strong> ${companyName}</p>
      </div>
    `;
    await sendResend({
      to,
      subject,
      html
    });
    return new Response(JSON.stringify({
      ok: true
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: String(e)
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...cors()
      }
    });
  }
});
