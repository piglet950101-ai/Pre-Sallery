-- Migration to add missing columns to audit_logs table
-- This will support the audit logging functionality

-- Add missing columns to audit_logs table
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS details TEXT;

ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS user_type TEXT;

-- Add comments for documentation
COMMENT ON COLUMN audit_logs.details IS 'Additional details about the audit event';
COMMENT ON COLUMN audit_logs.user_type IS 'Type of user who performed the action (operator, company, employee)';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_type ON audit_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON audit_logs USING gin(to_tsvector('english', details));
