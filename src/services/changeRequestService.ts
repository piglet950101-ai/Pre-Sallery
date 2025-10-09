import { supabase } from '@/lib/supabase';

export interface ChangeRequest {
  id?: string;
  employee_id: string;
  field_name: string;
  current_value?: string;
  requested_value?: string;
  reason: string;
  details?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: 'profile' | 'financial' | 'personal' | 'work' | 'contact';
  created_at?: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  metadata?: Record<string, any>;
}

export interface ChangeRequestFilters {
  status?: string[];
  category?: string[];
  priority?: string[];
  employee_id?: string;
  company_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface ChangeRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  by_category: Record<string, number>;
  by_priority: Record<string, number>;
}

class ChangeRequestService {
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
   * Create a new change request
   */
  async createChangeRequest(request: Omit<ChangeRequest, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ChangeRequest; error?: string }> {
    try {
      
      // Validate field name
      if (!ChangeRequestService.validateFieldName(request.field_name)) {
        return {
          success: false,
          error: `Invalid field name: ${request.field_name}. Valid fields are: ${ChangeRequestService.VALID_EMPLOYEE_FIELDS.join(', ')}`
        };
      }
      
      const { data, error } = await supabase
        .from('change_requests')
        .insert([{
          employee_id: request.employee_id,
          field_name: request.field_name,
          current_value: request.current_value,
          requested_value: request.requested_value,
          reason: request.reason,
          details: request.details,
          priority: request.priority || 'normal',
          category: request.category || 'profile',
          metadata: request.metadata || {}
        }])
        .select()
        .single();


      if (error) {
        console.error('Error creating change request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get change requests with filters
   */
  async getChangeRequests(filters: ChangeRequestFilters = {}, page = 1, limit = 20): Promise<{ success: boolean; data?: ChangeRequest[]; total?: number; error?: string }> {
    try {
      let query = supabase
        .from('change_requests')
        .select(`
          *,
          employees!inner(
            id,
            first_name,
            last_name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.priority && filters.priority.length > 0) {
        query = query.in('priority', filters.priority);
      }

      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.company_id) {
        query = query.eq('employees.company_id', filters.company_id);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`reason.ilike.%${filters.search}%,details.ilike.%${filters.search}%,field_name.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching change requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [], total: count || 0 };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a single change request by ID
   */
  async getChangeRequest(id: string): Promise<{ success: boolean; data?: ChangeRequest; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .select(`
          *,
          employees!inner(
            id,
            first_name,
            last_name,
            company_id,
            companies!inner(
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching change request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Update change request status
   */
  async updateChangeRequestStatus(
    id: string, 
    status: 'approved' | 'rejected' | 'cancelled',
    reviewerNotes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('change_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewer_notes: reviewerNotes
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating change request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Bulk update change request statuses
   */
  async bulkUpdateChangeRequests(
    ids: string[], 
    status: 'approved' | 'rejected' | 'cancelled',
    reviewerNotes?: string
  ): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id,
          reviewer_notes: reviewerNotes
        })
        .in('id', ids)
        .select('id');

      if (error) {
        console.error('Error bulk updating change requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, updatedCount: data?.length || 0 };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get change request statistics
   */
  async getChangeRequestStats(companyId?: string): Promise<{ success: boolean; data?: ChangeRequestStats; error?: string }> {
    try {
      let query = supabase
        .from('change_requests')
        .select('status, category, priority');

      if (companyId) {
        query = query.eq('employees.company_id', companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching change request stats:', error);
        return { success: false, error: error.message };
      }

      const stats: ChangeRequestStats = {
        total: data?.length || 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        by_category: {},
        by_priority: {}
      };

      data?.forEach(request => {
        // Count by status
        stats[request.status as keyof ChangeRequestStats] = (stats[request.status as keyof ChangeRequestStats] as number) + 1;
        
        // Count by category
        stats.by_category[request.category] = (stats.by_category[request.category] || 0) + 1;
        
        // Count by priority
        stats.by_priority[request.priority] = (stats.by_priority[request.priority] || 0) + 1;
      });

      return { success: true, data: stats };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete a change request
   */
  async deleteChangeRequest(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('change_requests')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting change request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get change requests for a specific employee
   */
  async getEmployeeChangeRequests(employeeId: string): Promise<{ success: boolean; data?: ChangeRequest[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('change_requests')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching employee change requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Change request service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const changeRequestService = new ChangeRequestService();
