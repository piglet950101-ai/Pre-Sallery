import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to get localized error messages
function getErrorMessage(key: string, language: string = 'en'): string {
  const messages = {
    'email_already_registered': {
      en: 'Email already registered',
      es: 'Correo electrónico ya registrado'
    },
    'rif_already_exists': {
      en: 'RIF already exists',
      es: 'RIF ya existe'
    },
    'failed_to_create_user': {
      en: 'Failed to create user account',
      es: 'Error al crear la cuenta de usuario'
    },
    'user_creation_failed': {
      en: 'User creation failed',
      es: 'Falló la creación del usuario'
    },
    'failed_to_create_company': {
      en: 'Failed to create company record',
      es: 'Error al crear el registro de empresa'
    },
    'failed_to_create_employee': {
      en: 'Failed to create employee record',
      es: 'Error al crear el registro de empleado'
    }
  }
  
  return messages[key]?.[language as keyof typeof messages[key]] || messages[key]?.en || key
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, userType, companyData, employeeData, language = 'en' } = await req.json()

    console.log('Registration request received:', {
      email,
      userType,
      language,
      hasCompanyData: !!companyData,
      hasEmployeeData: !!employeeData,
      companyDataKeys: companyData ? Object.keys(companyData) : null,
      employeeDataKeys: employeeData ? Object.keys(employeeData) : null
    })

    if (!email || !password || !userType) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and userType are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        }
      }
    )

    // Check if email already exists
    const { data: existingUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error checking existing users:', authError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const emailExists = existingUsers.users.some(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    )

    if (emailExists) {
      return new Response(
        JSON.stringify({ success: false, error: getErrorMessage('email_already_registered', language) }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create auth user
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      return new Response(
        JSON.stringify({ success: false, error: getErrorMessage('failed_to_create_user', language) }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authUser.user) {
      return new Response(
        JSON.stringify({ success: false, error: getErrorMessage('user_creation_failed', language) }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the same admin client for database operations to ensure proper permissions
    const supabase = supabaseAdmin

    // Test database connection and check companies table structure
    console.log('Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('Database connection test failed:', testError)
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed',
          details: testError.message,
          code: testError.code
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    console.log('Database connection successful')

    let redirectPath = '/';
    let userData = null;

    if (userType === 'company') {
      // Check if RIF already exists
      console.log('Checking if RIF already exists:', companyData?.rif)
      const { data: existingCompany, error: checkError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('rif', companyData?.rif || '')
        .maybeSingle()

      if (checkError) {
        console.error('Error checking RIF:', checkError)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to check RIF uniqueness',
            details: checkError.message
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (existingCompany) {
        console.error('RIF already exists:', existingCompany)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: getErrorMessage('rif_already_exists', language),
            details: `A company with RIF ${companyData?.rif} already exists`
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Create company record
      console.log('Creating company with data:', {
        auth_user_id: authUser.user.id,
        name: companyData?.name,
        rif: companyData?.rif,
        address: companyData?.address,
        phone: companyData?.phone,
        rif_image_url: companyData?.rif_image_url
      })

      // Try to insert company record
      console.log('Attempting to insert company record...')
      
      // First, let's try to see if we can read from companies table
      const { data: testRead, error: readError } = await supabase
        .from('companies')
        .select('id')
        .limit(1)
      
      console.log('Test read from companies:', { testRead, readError })
      
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          auth_user_id: authUser.user.id,
          name: companyData?.name || '',
          rif: companyData?.rif || '',
          address: companyData?.address || '',
          phone: companyData?.phone || '',
          rif_image_url: companyData?.rif_image_url || null,
          is_approved: false
        }])
        .select()
        .single()

      console.log('Company insert result:', { company, companyError })

      if (companyError) {
        console.error('Error creating company:', companyError)
        console.error('Company data received:', companyData)
        console.error('Auth user ID:', authUser.user.id)
        console.error('Full error object:', JSON.stringify(companyError, null, 2))
        
        // Clean up auth user if company creation fails
        try {
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          console.log('Successfully cleaned up auth user')
        } catch (cleanupError) {
          console.error('Failed to cleanup auth user:', cleanupError)
        }
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create company record',
            details: companyError.message,
            code: companyError.code,
            hint: companyError.hint,
            fullError: companyError
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Company created successfully:', company)

      redirectPath = '/company';
      userData = company;

    } else if (userType === 'employee') {
      // Create employee record with all required fields
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert([{
          auth_user_id: authUser.user.id,
          company_id: employeeData?.company_id,
          first_name: employeeData?.first_name || '',
          last_name: employeeData?.last_name || '',
          email: email.toLowerCase(),
          phone: employeeData?.phone || '',
          // Required fields with placeholder values that satisfy check constraints
          year_of_employment: employeeData?.year_of_employment || new Date().getFullYear(),
          position: employeeData?.position || 'Pending',
          employment_start_date: employeeData?.employment_start_date || new Date().toISOString().split('T')[0],
          employment_type: employeeData?.employment_type || 'full-time',
          weekly_hours: employeeData?.weekly_hours || 40,
          monthly_salary: employeeData?.monthly_salary || 1,
          living_expenses: employeeData?.living_expenses || 0,
          dependents: employeeData?.dependents || 0,
          emergency_contact: employeeData?.emergency_contact || 'Pending',
          emergency_phone: employeeData?.emergency_phone || 'Pending',
          address: employeeData?.address || 'Pending',
          city: employeeData?.city || 'Pending',
          state: employeeData?.state || 'Pending',
          bank_name: employeeData?.bank_name || 'Pending',
          account_number: employeeData?.account_number || '00000000000000000000',
          account_type: employeeData?.account_type || 'savings',
          // Set is_active to false until company approves
          is_active: employeeData?.is_active || false,
          // Generate a random activation code (not used in new flow but required by schema)
          activation_code: employeeData?.activation_code || Math.floor(100000 + Math.random() * 900000).toString(),
          is_verified: false,
          // Self-registered employees don't need to change password since they chose it during registration
          must_change_password: false
        }])
        .select()
        .single()

      if (employeeError) {
        console.error('Error creating employee:', employeeError)
        console.error('Employee data received:', employeeData)
        // Clean up auth user if employee creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create employee record',
            details: employeeError.message,
            code: employeeError.code
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      redirectPath = '/employee';
      userData = employee;
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        user: authUser.user,
        userData: userData,
        redirectPath: redirectPath,
        userType: userType
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in register-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
