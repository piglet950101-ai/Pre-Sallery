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
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { companyIds } = await req.json()

    if (!companyIds || !Array.isArray(companyIds)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Company IDs array is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get auth users for the company IDs
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`)
    }

    // Create a map of auth_user_id to email
    const authEmailMap: Record<string, string> = {}
    
    authUsers.users.forEach(user => {
      if (user.email) {
        authEmailMap[user.id] = user.email
      }
    })

    // Get companies with their auth_user_ids
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, auth_user_id')
      .in('id', companyIds)

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`)
    }

    // Map company IDs to their auth emails
    const companyEmailMap: Record<string, string> = {}
    
    companies.forEach(company => {
      if (company.auth_user_id && authEmailMap[company.auth_user_id]) {
        companyEmailMap[company.id] = authEmailMap[company.auth_user_id]
      }
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        companyEmails: companyEmailMap 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
