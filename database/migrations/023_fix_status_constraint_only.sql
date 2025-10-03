-- Fix the status constraint to allow new status values
-- This is a minimal fix that just updates the constraint

-- Drop the existing constraint
ALTER TABLE public.advance_transactions 
DROP CONSTRAINT IF EXISTS advance_transactions_status_check;

-- Add the new constraint with the additional status values
ALTER TABLE public.advance_transactions 
ADD CONSTRAINT advance_transactions_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'completada', 'rechazada', 'failed', 'completed', 'rejected'));

-- Add the new columns
ALTER TABLE public.advance_transactions 
ADD COLUMN IF NOT EXISTS payment_confirmation_url text,
ADD COLUMN IF NOT EXISTS payment_confirmation_uploaded_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_confirmation_uploaded_by uuid references auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS processed_by uuid references auth.users(id);

-- Add comments for documentation
COMMENT ON COLUMN advance_transactions.payment_confirmation_url IS 'URL to payment confirmation image/document';
COMMENT ON COLUMN advance_transactions.payment_confirmation_uploaded_at IS 'Timestamp when payment confirmation was uploaded';
COMMENT ON COLUMN advance_transactions.payment_confirmation_uploaded_by IS 'Operator who uploaded the payment confirmation';
COMMENT ON COLUMN advance_transactions.rejection_reason IS 'Reason for rejection if payment failed';
COMMENT ON COLUMN advance_transactions.processed_by IS 'Operator who processed the payment';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_advance_transactions_status ON advance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_processed_by ON advance_transactions(processed_by);
CREATE INDEX IF NOT EXISTS idx_advance_transactions_confirmation_uploaded_by ON advance_transactions(payment_confirmation_uploaded_by);
