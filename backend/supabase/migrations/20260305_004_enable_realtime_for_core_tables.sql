BEGIN;

-- Ensure UPDATE/DELETE events include row data in realtime payloads.
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.departments REPLICA IDENTITY FULL;
ALTER TABLE public.work_logs REPLICA IDENTITY FULL;
ALTER TABLE public.hourly_rates REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'departments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'work_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'hourly_rates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hourly_rates;
  END IF;
END
$$;

COMMIT;
