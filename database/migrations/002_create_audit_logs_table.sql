-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    employee_id UUID REFERENCES employees(id),
    company_id UUID REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical')),
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('authentication', 'profile', 'financial', 'security', 'system', 'general'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_employee_id ON audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.uid());

-- Company admins can view audit logs for their employees
CREATE POLICY "Company admins can view employee audit logs" ON audit_logs
    FOR SELECT USING (
        company_id IN (
            SELECT c.id FROM companies c
            WHERE c.auth_user_id = auth.uid()
        )
    );

-- System can insert audit logs (for triggers and functions)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Create function to log profile changes
CREATE OR REPLACE FUNCTION log_profile_change()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    employee_uuid UUID;
    company_uuid UUID;
BEGIN
    -- Get employee and company IDs
    SELECT id, company_id INTO employee_uuid, company_uuid
    FROM employees 
    WHERE auth_user_id = COALESCE(NEW.auth_user_id, OLD.auth_user_id);
    
    -- Convert old and new records to JSONB
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        employee_id,
        company_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        category,
        severity
    ) VALUES (
        COALESCE(NEW.auth_user_id, OLD.auth_user_id),
        employee_uuid,
        company_uuid,
        TG_OP,
        'employee_profile',
        employee_uuid,
        old_data,
        new_data,
        'profile',
        'info'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for employee profile changes
CREATE TRIGGER audit_employee_profile_changes
    AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION log_profile_change();

-- Create function to log change request actions
CREATE OR REPLACE FUNCTION log_change_request_action()
RETURNS TRIGGER AS $$
DECLARE
    employee_uuid UUID;
    company_uuid UUID;
BEGIN
    -- Get employee and company IDs
    SELECT e.id, e.company_id INTO employee_uuid, company_uuid
    FROM employees e
    WHERE e.id = COALESCE(NEW.employee_id, OLD.employee_id);
    
    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        employee_id,
        company_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        category,
        severity
    ) VALUES (
        COALESCE(NEW.reviewed_by, auth.uid()),
        employee_uuid,
        company_uuid,
        TG_OP || '_change_request',
        'change_request',
        COALESCE(NEW.id, OLD.id),
        to_jsonb(OLD),
        to_jsonb(NEW),
        'profile',
        CASE 
            WHEN NEW.status = 'approved' THEN 'info'
            WHEN NEW.status = 'rejected' THEN 'warn'
            ELSE 'info'
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for change request actions
CREATE TRIGGER audit_change_request_actions
    AFTER INSERT OR UPDATE ON change_requests
    FOR EACH ROW EXECUTE FUNCTION log_change_request_action();
