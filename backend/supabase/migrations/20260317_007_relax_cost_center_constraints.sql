BEGIN;

-- 1. Drop the unique index that prevents multiple departments from having empty cost_centers
DROP INDEX IF EXISTS public.idx_departments_cost_center_unique;

-- 2. Drop the old format check constraint
ALTER TABLE public.departments
  DROP CONSTRAINT IF EXISTS departments_cost_center_format_chk;

-- 3. Make the column nullable again (so empty or unconfigured is allowed)
ALTER TABLE public.departments
  ALTER COLUMN cost_center DROP NOT NULL;

-- 4. Re-add the check constraint, allowing NULL, empty string, or the new NN-NN-NN format
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
      CHECK (
        cost_center IS NULL 
        OR btrim(cost_center) = '' 
        OR cost_center ~ '^[0-9]{2}-[0-9]{2}-[0-9]{2}$'
        OR cost_center ~ '^[0-9]{2}-[0-9]{4}$' -- fallback for old ones
      );
  END IF;
END
$$;

COMMIT;
