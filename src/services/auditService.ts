import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id?: string;
  user_id?: string;
  employee_id?: string;
  company_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  severity?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  category?: 'authentication' | 'profile' | 'financial' | 'security' | 'system' | 'general';
  created_at?: string;
}

export interface AuditLogFilters {
  user_id?: string;
  employee_id?: string;
  company_id?: string;
  action?: string;
  resource_type?: string;
  severity?: string[];
  category?: string[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

class AuditService {
  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditLog, 'id' | 'created_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: event.user_id,
          employee_id: event.employee_id,
          company_id: event.company_id,
          action: event.action,
          resource_type: event.resource_type,
          resource_id: event.resource_id,
          old_values: event.old_values,
          new_values: event.new_values,
          metadata: event.metadata || {},
          ip_address: event.ip_address,
          user_agent: event.user_agent,
          session_id: event.session_id,
          severity: event.severity || 'info',
          category: event.category || 'general'
        }]);

      if (error) {
        console.error('Error logging audit event:', error);
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      console.error('Audit service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: AuditLogFilters = {}, page = 1, limit = 50): Promise<{ success: boolean; data?: AuditLog[]; total?: number; error?: string }> {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          employees!left(
            id,
            first_name,
            last_name,
            email
          ),
          companies!left(
            id,
            name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.company_id) {
        query = query.eq('company_id', filters.company_id);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }

      if (filters.severity && filters.severity.length > 0) {
        query = query.in('severity', filters.severity);
      }

      if (filters.category && filters.category.length > 0) {
        query = query.in('category', filters.category);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,resource_type.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [], total: count || 0 };

    } catch (error) {
      console.error('Audit service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(companyId?: string, days = 30): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - days);

      let query = supabase
        .from('audit_logs')
        .select('action, severity, category, created_at');

      if (companyId) {
        query = query.eq('company_id', companyId);
      }

      query = query.gte('created_at', dateFrom.toISOString());

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit stats:', error);
        return { success: false, error: error.message };
      }

      const stats = {
        total_events: data?.length || 0,
        by_action: {},
        by_severity: {},
        by_category: {},
        daily_events: {}
      };

      data?.forEach(log => {
        // Count by action
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
        
        // Count by severity
        stats.by_severity[log.severity] = (stats.by_severity[log.severity] || 0) + 1;
        
        // Count by category
        stats.by_category[log.category] = (stats.by_category[log.category] || 0) + 1;
        
        // Count by day
        const day = new Date(log.created_at).toISOString().split('T')[0];
        stats.daily_events[day] = (stats.daily_events[day] || 0) + 1;
      });

      return { success: true, data: stats };

    } catch (error) {
      console.error('Audit service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Log profile change
   */
  async logProfileChange(
    employeeId: string,
    field: string,
    oldValue: any,
    newValue: any,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return this.logEvent({
      user_id: userId,
      employee_id: employeeId,
      action: 'profile_update',
      resource_type: 'employee_profile',
      resource_id: employeeId,
      old_values: { [field]: oldValue },
      new_values: { [field]: newValue },
      metadata,
      category: 'profile',
      severity: 'info'
    });
  }

  /**
   * Log change request action
   */
  async logChangeRequestAction(
    changeRequestId: string,
    action: string,
    employeeId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return this.logEvent({
      user_id: userId,
      employee_id: employeeId,
      action,
      resource_type: 'change_request',
      resource_id: changeRequestId,
      metadata,
      category: 'profile',
      severity: action.includes('reject') ? 'warn' : 'info'
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    action: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return this.logEvent({
      user_id: userId,
      action,
      resource_type: 'authentication',
      metadata,
      category: 'authentication',
      severity: action.includes('failed') ? 'warn' : 'info'
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    action: string,
    userId?: string,
    employeeId?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> {
    return this.logEvent({
      user_id: userId,
      employee_id: employeeId,
      action,
      resource_type: 'security',
      metadata,
      category: 'security',
      severity: 'warn'
    });
  }

  /**
   * Get user's audit trail
   */
  async getUserAuditTrail(userId: string, limit = 100): Promise<{ success: boolean; data?: AuditLog[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user audit trail:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };

    } catch (error) {
      console.error('Audit service error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}

export const auditService = new AuditService();
