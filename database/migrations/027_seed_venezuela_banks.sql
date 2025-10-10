-- Seed Venezuela bank list into public.banks
-- Safe upserts based on unique name

INSERT INTO public.banks (name, code, is_active, supports_pagomovil, supports_transfer)
VALUES
  ('Banco de Venezuela', 'BDV', TRUE, TRUE, TRUE),
  ('Banesco Banco Universal', 'BANESCO', TRUE, TRUE, TRUE),
  ('Banco Mercantil', 'MERCANTIL', TRUE, TRUE, TRUE),
  ('Banco Provincial (BBVA)', 'PROVINCIAL', TRUE, TRUE, TRUE),
  ('Banco Nacional de Crédito (BNC)', 'BNC', TRUE, TRUE, TRUE),
  ('Banco Exterior', 'EXTERIOR', TRUE, TRUE, TRUE),
  ('Banco del Tesoro', 'TESORO', TRUE, TRUE, TRUE),
  ('Banco Bicentenario', 'BICENTENARIO', TRUE, TRUE, TRUE),
  ('Banco Fondo Común (BFC)', 'BFC', TRUE, TRUE, TRUE),
  ('Banco Plaza', 'PLAZA', TRUE, TRUE, TRUE),
  ('Banco Caroní', 'CARONI', TRUE, TRUE, TRUE),
  ('Bancaribe', 'BANCARIBE', TRUE, TRUE, TRUE),
  ('Sofitasa', 'SOFITASA', TRUE, TRUE, TRUE),
  ('100% Banco', '100BANCO', TRUE, TRUE, TRUE),
  ('Mi Banco', 'MIBANCO', TRUE, TRUE, TRUE),
  ('Banco Activo', 'ACTIVO', TRUE, TRUE, TRUE)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  supports_pagomovil = EXCLUDED.supports_pagomovil,
  supports_transfer = EXCLUDED.supports_transfer,
  updated_at = NOW();


