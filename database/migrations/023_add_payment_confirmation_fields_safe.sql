-- Add payment confirmation fields to advance_transactions table (Safe version)
ALTER TABLE public.advance_transactions 
ADD COLUMN IF NOT EXISTS payment_confirmation_url text,
ADD COLUMN IF NOT EXISTS payment_confirmation_uploaded_at timestamptz,
ADD COLUMN IF NOT EXISTS payment_confirmation_uploaded_by uuid references auth.users(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS processed_by uuid references auth.users(id);

-- First, let's see what status values exist and handle them properly
DO $$
DECLARE
    existing_statuses text[];
BEGIN
    -- Get all unique status values
    SELECT array_agg(DISTINCT status) INTO existing_statuses 
    FROM public.advance_transactions;
    
    -- Log what we found
    RAISE NOTICE 'Existing status values: %', existing_statuses;
    
    -- Update common variations to our standard values
    UPDATE public.advance_transactions 
    SET status = 'completada' 
    WHERE status IN ('completed', 'complete', 'success', 'successful');
    
    UPDATE public.advance_transactions 
    SET status = 'rechazada' 
    WHERE status IN ('rejected', 'reject', 'denied', 'cancelled', 'canceled');
    
    UPDATE public.advance_transactions 
    SET status = 'processing' 
    WHERE status IN ('in_progress', 'in-progress', 'processing', 'being_processed');
    
    -- For any remaining non-standard values, map them to 'pending' as a safe default
    UPDATE public.advance_transactions 
    SET status = 'pending' 
    WHERE status NOT IN ('pending', 'approved', 'processing', 'completada', 'rechazada', 'failed');
END $$;

-- Now safely drop and recreate the constraint
ALTER TABLE public.advance_transactions 
DROP CONSTRAINT IF EXISTS advance_transactions_status_check;

-- Add the new constraint
ALTER TABLE public.advance_transactions 
ADD CONSTRAINT advance_transactions_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'completada', 'rechazada', 'failed'));

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

-- Log completion
DO $$
DECLARE
    final_statuses text[];
    status_counts text;
BEGIN
    -- Get final status distribution
    SELECT string_agg(status || ': ' || count::text, ', ' ORDER BY status) INTO status_counts
    FROM (
        SELECT status, count(*) 
        FROM public.advance_transactions 
        GROUP BY status
    ) t;
    
    RAISE NOTICE 'Final status distribution: %', status_counts;
END $$;
