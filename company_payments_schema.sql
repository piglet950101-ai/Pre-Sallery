-- Company Payments Table Schema
-- This table stores payment records for companies

CREATE TABLE IF NOT EXISTS company_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('bank_transfer', 'pagomovil', 'credit_card')),
  payment_details TEXT,
  paid_date DATE,
  invoice_number VARCHAR(50) NOT NULL,
  period VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_payments_company_id ON company_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payments_status ON company_payments(status);
CREATE INDEX IF NOT EXISTS idx_company_payments_created_at ON company_payments(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE company_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: companies can only see their own payments
CREATE POLICY "Companies can view their own payments" ON company_payments
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policy: companies can insert their own payments
CREATE POLICY "Companies can insert their own payments" ON company_payments
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policy: companies can update their own payments
CREATE POLICY "Companies can update their own payments" ON company_payments
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create RLS policy: companies can delete their own payments
CREATE POLICY "Companies can delete their own payments" ON company_payments
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM companies 
      WHERE auth_user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_company_payments_updated_at 
  BEFORE UPDATE ON company_payments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
