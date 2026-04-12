-- EJECUTA ESTO EN EL SQL EDITOR DE TU SUPABASE (Dashboard)

BEGIN;

-- 1. Eliminar el índice único que impide que varios departamentos tengan centros de costo vacíos
DROP INDEX IF EXISTS public.idx_departments_cost_center_unique;

-- 2. Eliminar la restricción de formato antigua
ALTER TABLE public.departments
  DROP CONSTRAINT IF EXISTS departments_cost_center_format_chk;

-- 3. Permitir que la columna sea NULL (opcional)
ALTER TABLE public.departments
  ALTER COLUMN cost_center DROP NOT NULL;

-- 4. Re-crear la restricción permitiendo valores vacíos, nulos, o el formato correcto NN-NN-NN
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
        OR cost_center ~ '^[0-9]{2}-[0-9]{4}$'
      );
  END IF;
END
$$;

-- 5. Opcional: limpiar los departamentos que tengan formato incorrecto actual
UPDATE public.departments
SET cost_center = NULL
WHERE btrim(cost_center) = '' OR NOT (cost_center ~ '^[0-9]{2}-[0-9]{2}-[0-9]{2}$' OR cost_center ~ '^[0-9]{2}-[0-9]{4}$');

COMMIT;
