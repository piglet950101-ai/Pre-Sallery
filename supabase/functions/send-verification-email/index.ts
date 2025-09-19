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
    const { email, code, type } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // For demo purposes, we'll just log the email
    // In production, you would integrate with an email service like SendGrid, AWS SES, etc.
    console.log(`Sending verification email to ${email} with code ${code} for type ${type}`)

    // Example email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
            <h1 style="color: #333; margin-bottom: 20px;">Verification Code</h1>
            <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
              You requested to change your ${type === 'email' ? 'email address' : 'phone number'}. 
              Please use the following verification code to complete the process:
            </p>
            <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; 
                        padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This code will expire in 15 minutes. If you didn't request this change, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              This is an automated message from Pre-Sallery. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `

    // In production, you would send the actual email here
    // For now, we'll just return success
    // Example with SendGrid:
    /*
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'Verification Code - Pre-Sallery'
        }],
        from: { email: 'noreply@pre-sallery.com' },
        content: [{
          type: 'text/html',
          value: emailTemplate
        }]
      })
    })
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification email sent successfully',
        // For demo purposes, include the code in the response
        code: code
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error sending verification email:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to send verification email' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
