-- Migration to add missing columns to company_payments table
-- This will allow proper payment confirmation tracking

-- Add operator_name column to company_payments table
ALTER TABLE company_payments 
ADD COLUMN IF NOT EXISTS operator_name TEXT;

-- Add payment_reference column to company_payments table
ALTER TABLE company_payments 
ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add payment_notes column to company_payments table
ALTER TABLE company_payments 
ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Add payment_proof_url column to company_payments table
ALTER TABLE company_payments 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN company_payments.operator_name IS 'Name of the operator who confirmed the payment';
COMMENT ON COLUMN company_payments.payment_reference IS 'Reference number from the bank transfer';
COMMENT ON COLUMN company_payments.payment_notes IS 'Additional notes about the payment';
COMMENT ON COLUMN company_payments.payment_proof_url IS 'URL to the uploaded payment proof document';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_payments_operator_name ON company_payments(operator_name);
CREATE INDEX IF NOT EXISTS idx_company_payments_payment_reference ON company_payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_company_payments_payment_proof_url ON company_payments(payment_proof_url);
