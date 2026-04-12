BEGIN;

CREATE TABLE IF NOT EXISTS public.student_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, period_key)
);

ALTER TABLE public.student_receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_receivables_read"
  ON public.student_receivables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN', 'ACCOUNTING')
    )
  );

CREATE POLICY "student_receivables_insert_update"
  ON public.student_receivables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN', 'ACCOUNTING')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN', 'ACCOUNTING')
    )
  );

COMMIT;
