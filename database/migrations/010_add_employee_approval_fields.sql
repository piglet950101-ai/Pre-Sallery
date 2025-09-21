-- Migration to add employee approval fields
-- This allows companies to approve/reject employee applications

-- Add approval-related columns to the employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_employees_approval_status ON employees(is_approved);
CREATE INDEX IF NOT EXISTS idx_employees_approved_at ON employees(approved_at);
CREATE INDEX IF NOT EXISTS idx_employees_company_approval ON employees(company_id, is_approved);

-- Add comments for documentation
COMMENT ON COLUMN employees.is_approved IS 'Whether the employee has been approved by their company';
COMMENT ON COLUMN employees.approved_at IS 'Timestamp when the employee was approved';
COMMENT ON COLUMN employees.approved_by IS 'ID of the company user who approved the employee';
COMMENT ON COLUMN employees.rejection_reason IS 'Reason for rejection if the employee was rejected';
COMMENT ON COLUMN employees.rejected_at IS 'Timestamp when the employee was rejected';
COMMENT ON COLUMN employees.rejected_by IS 'ID of the company user who rejected the employee';

-- Update existing employees to be approved by default (for backward compatibility)
-- In a real scenario, you might want to review these manually
UPDATE employees 
SET is_approved = TRUE, 
    approved_at = created_at,
    approved_by = 'system'
WHERE is_approved IS NULL AND is_active = TRUE;
