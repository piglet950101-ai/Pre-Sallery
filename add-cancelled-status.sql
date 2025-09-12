-- Add 'cancelled' status to advance_transactions table
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE public.advance_transactions 
DROP CONSTRAINT IF EXISTS advance_transactions_status_check;

-- Add the new constraint with 'cancelled' status
ALTER TABLE public.advance_transactions 
ADD CONSTRAINT advance_transactions_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'cancelled'));

-- Verify the constraint was added
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'advance_transactions_status_check';
