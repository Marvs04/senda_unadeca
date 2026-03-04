-- SENDA full backend schema for Supabase
-- Generated from BACKEND_SPEC.md + current frontend/hook/service behavior

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM (
      'SUPER_ADMIN',
      'ADMIN',
      'DEPT_HEAD',
      'STUDENT',
      'ACCOUNTING'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_log_status') THEN
    CREATE TYPE work_log_status AS ENUM (
      'PENDING',
      'APPROVED',
      'REJECTED',
      'PROCESSED'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.departments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  head_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            user_role NOT NULL,
  carnet          TEXT UNIQUE,
  employee_number TEXT UNIQUE,
  department_id   UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT profiles_role_fields_chk CHECK (
    (
      role IN ('SUPER_ADMIN', 'ADMIN', 'ACCOUNTING')
      AND carnet IS NULL
      AND employee_number IS NULL
    )
    OR (
      role = 'DEPT_HEAD'
      AND carnet IS NULL
      AND employee_number IS NOT NULL
    )
    OR (
      role = 'STUDENT'
      AND carnet IS NOT NULL
      AND employee_number IS NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS public.work_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  department_id    UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  date             DATE NOT NULL,
  hours            NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 12),
  description      TEXT NOT NULL CHECK (char_length(description) <= 200),
  status           work_log_status NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT CHECK (char_length(rejection_reason) <= 150),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_rejection_reason CHECK (
    status <> 'REJECTED'
    OR (rejection_reason IS NOT NULL AND char_length(rejection_reason) > 0)
  )
);

CREATE TABLE IF NOT EXISTS public.hourly_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate           NUMERIC(10,2) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kiosk schema (Appendix D)
CREATE TABLE IF NOT EXISTS public.kiosk_state (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  activated_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  activated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  shifts        JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (department_id)
);

CREATE TABLE IF NOT EXISTS public.kiosk_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id   UUID NOT NULL REFERENCES public.kiosk_state(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kiosk_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_student ON public.work_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_department ON public.work_logs(department_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_status ON public.work_logs(status);
CREATE INDEX IF NOT EXISTS idx_work_logs_date ON public.work_logs(date DESC);
CREATE INDEX IF NOT EXISTS idx_work_logs_dept_status ON public.work_logs(department_id, status);
CREATE INDEX IF NOT EXISTS idx_rates_effective ON public.hourly_rates(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_kiosk_sessions_kiosk ON public.kiosk_sessions(kiosk_id);
CREATE INDEX IF NOT EXISTS idx_kiosk_sessions_student ON public.kiosk_sessions(student_id);

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_department()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS departments_updated_at ON public.departments;
CREATE TRIGGER departments_updated_at
BEFORE UPDATE ON public.departments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS work_logs_updated_at ON public.work_logs;
CREATE TRIGGER work_logs_updated_at
BEFORE UPDATE ON public.work_logs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, carnet, employee_number, department_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    NULLIF(NEW.raw_user_meta_data ->> 'carnet', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'employee_number', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'department_id', '')::UUID
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    carnet = EXCLUDED.carnet,
    employee_number = EXCLUDED.employee_number,
    department_id = EXCLUDED.department_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_current_rate()
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT rate
  FROM public.hourly_rates
  WHERE effective_date <= CURRENT_DATE
  ORDER BY effective_date DESC
  LIMIT 1;
$$;

-- Compatibility view for current frontend service layer (TABLES.USERS = 'users')
CREATE OR REPLACE VIEW public.users AS
SELECT
  id,
  name,
  role::text AS role,
  carnet,
  employee_number,
  department_id,
  created_at,
  updated_at
FROM public.profiles;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosk_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "profiles: self_read" ON public.profiles;
CREATE POLICY "profiles: self_read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles: superadmin_read" ON public.profiles;
CREATE POLICY "profiles: superadmin_read"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'SUPER_ADMIN'
    AND role <> 'SUPER_ADMIN'
  );

DROP POLICY IF EXISTS "profiles: admin_read" ON public.profiles;
CREATE POLICY "profiles: admin_read"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'ADMIN'
    AND role IN ('STUDENT', 'DEPT_HEAD', 'ACCOUNTING')
  );

DROP POLICY IF EXISTS "profiles: depthead_read_students" ON public.profiles;
CREATE POLICY "profiles: depthead_read_students"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'DEPT_HEAD'
    AND role = 'STUDENT'
    AND department_id = public.current_user_department()
  );

DROP POLICY IF EXISTS "profiles: accounting_read_students" ON public.profiles;
CREATE POLICY "profiles: accounting_read_students"
  ON public.profiles FOR SELECT
  USING (
    public.current_user_role() = 'ACCOUNTING'
    AND role = 'STUDENT'
  );

DROP POLICY IF EXISTS "profiles: superadmin_insert" ON public.profiles;
CREATE POLICY "profiles: superadmin_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'SUPER_ADMIN'
    AND role IN ('ADMIN', 'ACCOUNTING')
  );

DROP POLICY IF EXISTS "profiles: admin_insert_depthead" ON public.profiles;
CREATE POLICY "profiles: admin_insert_depthead"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'ADMIN'
    AND role = 'DEPT_HEAD'
  );

DROP POLICY IF EXISTS "profiles: admin_insert_student" ON public.profiles;
CREATE POLICY "profiles: admin_insert_student"
  ON public.profiles FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'ADMIN'
    AND role = 'STUDENT'
  );

DROP POLICY IF EXISTS "profiles: admin_update" ON public.profiles;
CREATE POLICY "profiles: admin_update"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'ADMIN')
  WITH CHECK (role IN ('STUDENT', 'DEPT_HEAD'));

DROP POLICY IF EXISTS "profiles: admin_delete_depthead" ON public.profiles;
CREATE POLICY "profiles: admin_delete_depthead"
  ON public.profiles FOR DELETE
  USING (
    public.current_user_role() = 'ADMIN'
    AND role = 'DEPT_HEAD'
  );

-- Departments policies
DROP POLICY IF EXISTS "departments: all_read" ON public.departments;
CREATE POLICY "departments: all_read"
  ON public.departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "departments: admin_insert" ON public.departments;
CREATE POLICY "departments: admin_insert"
  ON public.departments FOR INSERT
  WITH CHECK (public.current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "departments: admin_update" ON public.departments;
CREATE POLICY "departments: admin_update"
  ON public.departments FOR UPDATE
  USING (public.current_user_role() = 'ADMIN');

DROP POLICY IF EXISTS "departments: admin_delete" ON public.departments;
CREATE POLICY "departments: admin_delete"
  ON public.departments FOR DELETE
  USING (public.current_user_role() = 'ADMIN');

-- Work logs policies
DROP POLICY IF EXISTS "work_logs: student_read" ON public.work_logs;
CREATE POLICY "work_logs: student_read"
  ON public.work_logs FOR SELECT
  USING (
    public.current_user_role() = 'STUDENT'
    AND student_id = auth.uid()
  );

DROP POLICY IF EXISTS "work_logs: student_insert" ON public.work_logs;
CREATE POLICY "work_logs: student_insert"
  ON public.work_logs FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'STUDENT'
    AND student_id = auth.uid()
    AND department_id = public.current_user_department()
    AND status = 'PENDING'
  );

DROP POLICY IF EXISTS "work_logs: depthead_read" ON public.work_logs;
CREATE POLICY "work_logs: depthead_read"
  ON public.work_logs FOR SELECT
  USING (
    public.current_user_role() = 'DEPT_HEAD'
    AND department_id = public.current_user_department()
  );

DROP POLICY IF EXISTS "work_logs: depthead_insert" ON public.work_logs;
CREATE POLICY "work_logs: depthead_insert"
  ON public.work_logs FOR INSERT
  WITH CHECK (
    public.current_user_role() = 'DEPT_HEAD'
    AND department_id = public.current_user_department()
    AND status = 'APPROVED'
  );

DROP POLICY IF EXISTS "work_logs: depthead_update_status" ON public.work_logs;
CREATE POLICY "work_logs: depthead_update_status"
  ON public.work_logs FOR UPDATE
  USING (
    public.current_user_role() = 'DEPT_HEAD'
    AND department_id = public.current_user_department()
    AND status = 'PENDING'
  )
  WITH CHECK (status IN ('APPROVED', 'REJECTED'));

DROP POLICY IF EXISTS "work_logs: accounting_read" ON public.work_logs;
CREATE POLICY "work_logs: accounting_read"
  ON public.work_logs FOR SELECT
  USING (public.current_user_role() = 'ACCOUNTING');

DROP POLICY IF EXISTS "work_logs: accounting_process" ON public.work_logs;
CREATE POLICY "work_logs: accounting_process"
  ON public.work_logs FOR UPDATE
  USING (
    public.current_user_role() = 'ACCOUNTING'
    AND status = 'APPROVED'
  )
  WITH CHECK (status = 'PROCESSED');

DROP POLICY IF EXISTS "work_logs: admin_read" ON public.work_logs;
CREATE POLICY "work_logs: admin_read"
  ON public.work_logs FOR SELECT
  USING (public.current_user_role() = 'ADMIN');

-- Hourly rates policies
DROP POLICY IF EXISTS "hourly_rates: all_read" ON public.hourly_rates;
CREATE POLICY "hourly_rates: all_read"
  ON public.hourly_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hourly_rates: admin_insert" ON public.hourly_rates;
CREATE POLICY "hourly_rates: admin_insert"
  ON public.hourly_rates FOR INSERT
  WITH CHECK (public.current_user_role() = 'ADMIN');

-- Kiosk policies
DROP POLICY IF EXISTS "Dept head manages own kiosk" ON public.kiosk_state;
CREATE POLICY "Dept head manages own kiosk"
ON public.kiosk_state
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('DEPT_HEAD', 'SUPER_ADMIN')
      AND (p.department_id = kiosk_state.department_id OR p.role = 'SUPER_ADMIN')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role IN ('DEPT_HEAD', 'SUPER_ADMIN')
      AND (p.department_id = kiosk_state.department_id OR p.role = 'SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Read kiosk state" ON public.kiosk_state;
CREATE POLICY "Read kiosk state"
ON public.kiosk_state
FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Student can clock in to own dept kiosk" ON public.kiosk_sessions;
CREATE POLICY "Student can clock in to own dept kiosk"
ON public.kiosk_sessions
FOR INSERT
WITH CHECK (
  student_id = auth.uid()
  AND (
    SELECT p.department_id FROM public.profiles p WHERE p.id = auth.uid()
  ) = (
    SELECT ks.department_id FROM public.kiosk_state ks WHERE ks.id = kiosk_id
  )
);

DROP POLICY IF EXISTS "Dept head can cancel sessions" ON public.kiosk_sessions;
CREATE POLICY "Dept head can cancel sessions"
ON public.kiosk_sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.kiosk_state ks ON ks.id = kiosk_sessions.kiosk_id
    WHERE p.id = auth.uid()
      AND p.role IN ('DEPT_HEAD', 'SUPER_ADMIN')
      AND (p.department_id = ks.department_id OR p.role = 'SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Read sessions" ON public.kiosk_sessions;
CREATE POLICY "Read sessions"
ON public.kiosk_sessions
FOR SELECT
USING (auth.uid() IS NOT NULL);

COMMIT;
