-- Migration to add company approval fields
-- This allows operators to approve/reject company registrations

-- Add approval-related columns to the companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejected_by TEXT;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_companies_approval_status ON companies(is_approved);
CREATE INDEX IF NOT EXISTS idx_companies_approved_at ON companies(approved_at);

-- Add comments for documentation
COMMENT ON COLUMN companies.is_approved IS 'Whether the company has been approved by an operator';
COMMENT ON COLUMN companies.approved_at IS 'Timestamp when the company was approved';
COMMENT ON COLUMN companies.approved_by IS 'ID of the operator who approved the company';
COMMENT ON COLUMN companies.rejection_reason IS 'Reason for rejection if the company was rejected';
COMMENT ON COLUMN companies.rejected_at IS 'Timestamp when the company was rejected';
COMMENT ON COLUMN companies.rejected_by IS 'ID of the operator who rejected the company';

-- Update existing companies to be approved by default (for backward compatibility)
-- In a real scenario, you might want to review these manually
UPDATE companies 
SET is_approved = TRUE, 
    approved_at = created_at,
    approved_by = 'system'
WHERE is_approved IS NULL;
