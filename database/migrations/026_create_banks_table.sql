-- Create banks table for dropdown selection
-- This provides a standardized list of banks for PagoMóvil and bank transfers

CREATE TABLE IF NOT EXISTS public.banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  supports_pagomovil BOOLEAN DEFAULT TRUE,
  supports_transfer BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_banks_name ON public.banks(name);
CREATE INDEX IF NOT EXISTS idx_banks_code ON public.banks(code);
CREATE INDEX IF NOT EXISTS idx_banks_active ON public.banks(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.banks IS 'List of banks available for PagoMóvil and bank transfers';
COMMENT ON COLUMN public.banks.name IS 'Full name of the bank';
COMMENT ON COLUMN public.banks.code IS 'Short code for the bank';
COMMENT ON COLUMN public.banks.is_active IS 'Whether the bank is currently active';
COMMENT ON COLUMN public.banks.supports_pagomovil IS 'Whether the bank supports PagoMóvil';
COMMENT ON COLUMN public.banks.supports_transfer IS 'Whether the bank supports bank transfers';

-- Enable Row Level Security
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to read active banks
DROP POLICY IF EXISTS "banks_select_all" ON public.banks;
CREATE POLICY "banks_select_all" ON public.banks
  FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated users to insert/update (for admin management)
DROP POLICY IF EXISTS "banks_write_authenticated" ON public.banks;
CREATE POLICY "banks_write_authenticated" ON public.banks
  FOR INSERT TO authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "banks_update_authenticated" ON public.banks;
CREATE POLICY "banks_update_authenticated" ON public.banks
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Insert common Venezuelan banks
INSERT INTO public.banks (name, code, supports_pagomovil, supports_transfer) VALUES
  ('Banco de Venezuela', 'BDV', TRUE, TRUE),
  ('Banco Mercantil', 'MERCANTIL', TRUE, TRUE),
  ('Banesco', 'BANESCO', TRUE, TRUE),
  ('Banco Provincial', 'PROVINCIAL', TRUE, TRUE),
  ('BOD', 'BOD', TRUE, TRUE),
  ('100% Banco', '100BANCO', TRUE, TRUE),
  ('Banco del Tesoro', 'TESORO', TRUE, TRUE),
  ('Banco Bicentenario', 'BICENTENARIO', TRUE, TRUE),
  ('Banco de la Fuerza Armada Nacional Bolivariana', 'BANFANB', TRUE, TRUE),
  ('Banco del Pueblo Soberano', 'BPS', TRUE, TRUE),
  ('Banco Agrícola de Venezuela', 'BAV', TRUE, TRUE),
  ('Banco Central de Venezuela', 'BCV', FALSE, TRUE),
  ('Banco de Comercio Exterior', 'BANCOEX', FALSE, TRUE),
  ('Banco Nacional de Crédito', 'BNC', TRUE, TRUE),
  ('Banco Plaza', 'PLAZA', TRUE, TRUE),
  ('Banco Sofitasa', 'SOFITASA', TRUE, TRUE),
  ('Citibank Venezuela', 'CITIBANK', TRUE, TRUE),
  ('Corp Banca', 'CORPBANCA', TRUE, TRUE),
  ('Fondo Común', 'FONDOCOMUN', TRUE, TRUE),
  ('Instituto Municipal de Crédito Popular', 'IMCP', TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_banks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_banks_updated_at
  BEFORE UPDATE ON public.banks
  FOR EACH ROW EXECUTE FUNCTION update_banks_updated_at();
