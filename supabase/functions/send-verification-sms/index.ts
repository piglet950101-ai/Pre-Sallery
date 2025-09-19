import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, code, type } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For demo purposes, we'll just log the SMS
    // In production, you would integrate with an SMS service like Twilio, AWS SNS, etc.
    console.log(`Sending verification SMS to ${phone} with code ${code} for type ${type}`)

    // Example SMS message
    const smsMessage = `Pre-Sallery verification code: ${code}. This code expires in 15 minutes. If you didn't request this change, please ignore this message.`

    // In production, you would send the actual SMS here
    // Example with Twilio:
    /*
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phone,
          Body: smsMessage,
        }),
      }
    )
    
    if (!response.ok) {
      throw new Error(`Twilio API error: ${response.statusText}`)
    }
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification SMS sent successfully',
        // For demo purposes, include the code in the response
        code: code
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending verification SMS:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send verification SMS' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
