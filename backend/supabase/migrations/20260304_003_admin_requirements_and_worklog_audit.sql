BEGIN;

-- Optional institutional email for student/dept head/admin records.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institutional_email TEXT;

UPDATE public.profiles
SET institutional_email = NULL
WHERE institutional_email IS NOT NULL
  AND btrim(institutional_email) = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_institutional_email_format_chk'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_institutional_email_format_chk
      CHECK (
        institutional_email IS NULL
        OR institutional_email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_institutional_email_unique
ON public.profiles (lower(institutional_email))
WHERE institutional_email IS NOT NULL;

-- Mandatory accounting cost center format: NN-NNNN
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS cost_center TEXT;

WITH numbered AS (
  SELECT
    id,
    lpad(row_number() OVER (ORDER BY created_at, id)::text, 6, '0') AS cc_digits
  FROM public.departments
)
UPDATE public.departments d
SET cost_center = substring(n.cc_digits FROM 1 FOR 2) || '-' || substring(n.cc_digits FROM 3 FOR 4)
FROM numbered n
WHERE d.id = n.id
  AND (d.cost_center IS NULL OR btrim(d.cost_center) = '');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'departments_cost_center_format_chk'
      AND conrelid = 'public.departments'::regclass
  ) THEN
    ALTER TABLE public.departments
      ADD CONSTRAINT departments_cost_center_format_chk
      CHECK (cost_center ~ '^[0-9]{2}-[0-9]{4}$');
  END IF;
END
$$;

ALTER TABLE public.departments
  ALTER COLUMN cost_center SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_cost_center_unique
ON public.departments (cost_center);

-- Work-log lifecycle audit fields for dashboard details and traceability.
ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS entry_source TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

UPDATE public.work_logs
SET entry_source = 'MANUAL'
WHERE entry_source IS NULL OR btrim(entry_source) = '';

UPDATE public.work_logs
SET rejection_reason = NULL
WHERE status <> 'REJECTED';

WITH dept_heads AS (
  SELECT id AS department_id, head_id
  FROM public.departments
)
UPDATE public.work_logs wl
SET approved_by = COALESCE(wl.approved_by, dh.head_id),
    approved_at = COALESCE(
      wl.approved_at,
      CASE
        WHEN COALESCE(wl.approved_by, dh.head_id) IS NOT NULL THEN wl.updated_at
        ELSE NULL
      END
    )
FROM dept_heads dh
WHERE wl.department_id = dh.department_id
  AND wl.status IN ('APPROVED', 'PROCESSED')
  AND (wl.approved_by IS NULL OR wl.approved_at IS NULL);

WITH dept_heads AS (
  SELECT id AS department_id, head_id
  FROM public.departments
)
UPDATE public.work_logs wl
SET rejected_by = COALESCE(wl.rejected_by, dh.head_id),
    rejected_at = COALESCE(
      wl.rejected_at,
      CASE
        WHEN COALESCE(wl.rejected_by, dh.head_id) IS NOT NULL THEN wl.updated_at
        ELSE NULL
      END
    )
FROM dept_heads dh
WHERE wl.department_id = dh.department_id
  AND wl.status = 'REJECTED'
  AND (wl.rejected_by IS NULL OR wl.rejected_at IS NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_logs_entry_source_chk'
      AND conrelid = 'public.work_logs'::regclass
  ) THEN
    ALTER TABLE public.work_logs
      ADD CONSTRAINT work_logs_entry_source_chk
      CHECK (entry_source IN ('MANUAL', 'KIOSK'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_logs_approved_pair_chk'
      AND conrelid = 'public.work_logs'::regclass
  ) THEN
    ALTER TABLE public.work_logs
      ADD CONSTRAINT work_logs_approved_pair_chk
      CHECK ((approved_by IS NULL) = (approved_at IS NULL));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_logs_rejected_pair_chk'
      AND conrelid = 'public.work_logs'::regclass
  ) THEN
    ALTER TABLE public.work_logs
      ADD CONSTRAINT work_logs_rejected_pair_chk
      CHECK ((rejected_by IS NULL) = (rejected_at IS NULL));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_logs_time_order_chk'
      AND conrelid = 'public.work_logs'::regclass
  ) THEN
    ALTER TABLE public.work_logs
      ADD CONSTRAINT work_logs_time_order_chk
      CHECK (start_time IS NULL OR end_time IS NULL OR end_time >= start_time);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_work_logs_entry_source ON public.work_logs (entry_source);
CREATE INDEX IF NOT EXISTS idx_work_logs_approved_at ON public.work_logs (approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_rejected_at ON public.work_logs (rejected_at DESC);

COMMIT;
