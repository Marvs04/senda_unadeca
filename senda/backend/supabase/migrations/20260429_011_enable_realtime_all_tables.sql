-- Enable REPLICA IDENTITY FULL and add to supabase_realtime publication
-- for all tables not covered by migration 004.
-- Covers: kiosk_state, kiosk_sessions, accounting_config, student_receivables,
--         active_timer_sessions, session_locks

BEGIN;

-- ── REPLICA IDENTITY FULL ─────────────────────────────────────────────────────
-- Required so UPDATE/DELETE events carry the full row in the realtime payload.

ALTER TABLE public.kiosk_state           REPLICA IDENTITY FULL;
ALTER TABLE public.kiosk_sessions        REPLICA IDENTITY FULL;
ALTER TABLE public.accounting_config     REPLICA IDENTITY FULL;
ALTER TABLE public.student_receivables   REPLICA IDENTITY FULL;
ALTER TABLE public.active_timer_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_locks         REPLICA IDENTITY FULL;

-- ── Add tables to supabase_realtime publication ───────────────────────────────

DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'kiosk_state',
    'kiosk_sessions',
    'accounting_config',
    'student_receivables',
    'active_timer_sessions',
    'session_locks'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname    = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename  = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END
$$;

COMMIT;
