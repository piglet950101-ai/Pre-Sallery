import { supabase } from '../lib/supabase'

export interface EmployeeUpdateData {
  employee_id: string
  field_name: string
  field_value: any
  company_id: string
}

export class EmployeeService {
  // Valid fields that can be updated in the employees table
  private static readonly VALID_EMPLOYEE_FIELDS = [
    'first_name',
    'last_name', 
    'email',
    'phone',
    'cedula',
    'birth_date',
    'year_of_employment',
    'position',
    'department',
    'employment_start_date',
    'employment_type',
    'weekly_hours',
    'monthly_salary',
    'living_expenses',
    'dependents',
    'emergency_contact',
    'emergency_phone',
    'address',
    'city',
    'state',
    'postal_code',
    'bank_name',
    'account_number',
    'account_type',
    'notes'
  ];

  /**
   * Validate if a field name is valid for employee updates
   */
  private static validateFieldName(fieldName: string): boolean {
    return this.VALID_EMPLOYEE_FIELDS.includes(fieldName);
  }

  /**
   * Update an employee's profile field using a direct SQL query that bypasses RLS
   * This is used for change request approvals by company admins
   */
  static async updateEmployeeField(data: EmployeeUpdateData) {
    try {
      
      // Validate field name
      
      if (!this.validateFieldName(data.field_name)) {
        throw new Error(`Invalid field name: ${data.field_name}. Valid fields are: ${this.VALID_EMPLOYEE_FIELDS.join(', ')}`);
      }
      
      // First, verify the company admin has permission
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Verify the user is a company admin for this company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('auth_user_id', user.id)
        .eq('id', data.company_id)
        .single()

      if (companyError || !company) {
        throw new Error('Unauthorized: Not a company admin for this company')
      }

      // Verify the employee belongs to this company
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, company_id')
        .eq('id', data.employee_id)
        .eq('company_id', data.company_id)
        .single()

      if (employeeError || !employee) {
        throw new Error('Employee not found or does not belong to this company')
      }

      // Use a direct SQL query to update the employee record
      // This bypasses RLS by using a more specific query
      const updateData = { [data.field_name]: data.field_value }
      
      
      const { data: updateResult, error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', data.employee_id)
        .eq('company_id', data.company_id) // Double-check company_id for security
        .select()


      if (updateError) {
        console.error('EmployeeService: Update error:', updateError)
        throw new Error(`Failed to update employee profile: ${updateError.message}`)
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('EmployeeService: No rows updated')
        throw new Error('No rows were updated. This might be due to Row Level Security policies.')
      }


      // Log the update for audit purposes
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          employee_id: data.employee_id,
          company_id: data.company_id,
          action: 'update_employee_field',
          resource_type: 'employee_profile',
          resource_id: data.employee_id,
          old_values: { [data.field_name]: employee[data.field_name] },
          new_values: { [data.field_name]: data.field_value },
          metadata: {
            field_name: data.field_name,
            old_value: employee[data.field_name],
            new_value: data.field_value,
            company_id: data.company_id
          },
          category: 'profile',
          severity: 'info'
        })

      return {
        success: true,
        data: updateResult[0],
        message: 'Employee profile updated successfully'
      }

    } catch (error) {
      console.error('EmployeeService: Error updating employee:', error)
      throw error
    }
  }

  /**
   * Get employee by ID with company verification
   */
  static async getEmployeeById(employeeId: string, companyId: string) {
    try {
      const { data: employee, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .eq('company_id', companyId)
        .single()

      if (error) {
        throw new Error(`Failed to get employee: ${error.message}`)
      }

      return employee
    } catch (error) {
      console.error('EmployeeService: Error getting employee:', error)
      throw error
    }
  }
}
