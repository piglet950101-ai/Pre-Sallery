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
    // Create a Supabase client with the service role key
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the request body
    const { employee_id, field_name, field_value, company_id } = await req.json()

    if (!employee_id || !field_name || field_value === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: employee_id, field_name, field_value' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the user is a company admin for this company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('auth_user_id', user.id)
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Not a company admin for this company' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify that the employee belongs to this company
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, first_name, last_name, company_id')
      .eq('id', employee_id)
      .eq('company_id', company_id)
      .single()

    if (employeeError || !employee) {
      return new Response(
        JSON.stringify({ error: 'Employee not found or does not belong to this company' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the employee record using the service role (bypasses RLS)
    const updateData = { [field_name]: field_value }
    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('employees')
      .update(updateData)
      .eq('id', employee_id)
      .select()

    if (updateError) {
      console.error('Update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update employee profile', details: updateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the update for audit purposes
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        table_name: 'employees',
        record_id: employee_id,
        action: 'update',
        changes: updateData,
        user_id: user.id,
        user_type: 'company_admin',
        metadata: {
          field_name,
          old_value: employee[field_name],
          new_value: field_value,
          company_id
        }
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Employee profile updated successfully',
        data: updateResult[0]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
