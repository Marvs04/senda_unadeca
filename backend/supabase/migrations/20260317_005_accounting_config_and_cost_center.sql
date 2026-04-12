-- Migration to add accounting configurations

BEGIN;

-- 1. Add cost_center to departments
ALTER TABLE public.departments
ADD COLUMN IF NOT EXISTS cost_center TEXT;

-- 2. Create accounting_config table (single-row table pattern)
CREATE TABLE IF NOT EXISTS public.accounting_config (
  id                 INTEGER PRIMARY KEY CHECK (id = 1),
  becas_account      TEXT NOT NULL DEFAULT '',
  becas_name         TEXT NOT NULL DEFAULT 'Becas Estudiantiles',
  diezmo_account     TEXT NOT NULL DEFAULT '',
  diezmo_name        TEXT NOT NULL DEFAULT 'Diezmos',
  payable_account    TEXT NOT NULL DEFAULT '',
  payable_name       TEXT NOT NULL DEFAULT 'Cuentas por Pagar',
  receivable_account TEXT NOT NULL DEFAULT '',
  receivable_name    TEXT NOT NULL DEFAULT 'Cuentas por Cobrar',
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the initial row if it doesn't exist
INSERT INTO public.accounting_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- RLS for accounting_config
ALTER TABLE public.accounting_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounting_config: all_read"
  ON public.accounting_config FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "accounting_config: admin_update"
  ON public.accounting_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN', 'ACCOUNTING')
    )
  );

-- Helper loop to update existing departments if needed:
-- update departments set cost_center = '' where cost_center is null;

COMMIT;
