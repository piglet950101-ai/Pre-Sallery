// supabase/functions/send-company-revoked-email/index.ts
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, {
    status: 204,
    headers: cors()
  });
  
  try {
    const { to, subject, companyName, reason, message } = await req.json();
    if (!to) throw new Error("Missing 'to' email");
    if (!reason) throw new Error("Missing 'reason' for revocation");
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin: 0 0 10px 0;">${subject}</h2>
          <p style="margin: 0; color: #6c757d;">${message}</p>
        </div>
        
        <div style="background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px;">
          <h3 style="color: #495057; margin: 0 0 15px 0;">Company Details</h3>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${companyName}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <h3 style="color: #495057; margin: 20px 0 15px 0;">Reason for Access Revocation</h3>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #dc3545;">
            <p style="margin: 0; color: #495057;">${reason}</p>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #6c757d;">
            If you believe this revocation was made in error, please contact our support team immediately.
          </p>
        </div>
      </div>
    `;
    
    await sendResend({
      to,
      subject,
      html
    });
    
    return new Response(JSON.stringify({
      ok: true,
      message: "Revocation email sent successfully"
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
