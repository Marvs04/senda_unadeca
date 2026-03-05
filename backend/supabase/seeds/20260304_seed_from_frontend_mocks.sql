BEGIN;

-- Seed de prueba basado en frontend/api/__mocks__.ts
-- Ejecutar en Supabase SQL Editor (rol postgres/service_role)

-- 1) Departamentos
INSERT INTO public.departments (name, cost_center)
VALUES
  ('U Virtual', '10-0001'),
  ('Mantenimiento', '20-0001'),
  ('Biblioteca', '30-0001')
ON CONFLICT (name) DO UPDATE
SET cost_center = EXCLUDED.cost_center;

-- 2) Helper para crear usuarios auth + profile (idempotente)
CREATE OR REPLACE FUNCTION public.create_senda_auth_user_if_missing(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role user_role,
  p_carnet TEXT DEFAULT NULL,
  p_employee_number TEXT DEFAULT NULL,
  p_department_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;

  v_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object(
      'name', p_name,
      'role', p_role::text,
      'carnet', p_carnet,
      'employee_number', p_employee_number,
      'department_id', p_department_id
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  RETURN v_user_id;
END;
$$;

-- 3) Crear cuentas equivalentes a mocks
-- Login identifiers:
-- SUPER_ADMIN: director-ti
-- ADMIN: ivonne-ramirez, rector-flores
-- ACCOUNTING: alejandra-pena
-- DEPT_HEAD: emp-001, emp-002
-- STUDENT: 20240101, 20240202, 20240303
WITH d AS (
  SELECT
    (SELECT id FROM public.departments WHERE name = 'U Virtual' LIMIT 1) AS dept_uv,
    (SELECT id FROM public.departments WHERE name = 'Mantenimiento' LIMIT 1) AS dept_mt
)
SELECT
  public.create_senda_auth_user_if_missing(
    'director-ti@senda.internal',
    'SuperAdmin#2026',
    'Director TI',
    'SUPER_ADMIN'
  ),
  public.create_senda_auth_user_if_missing(
    'ivonne-ramirez@senda.internal',
    'Admin#2026',
    'Ivonne Ramírez',
    'ADMIN'
  ),
  public.create_senda_auth_user_if_missing(
    'rector-flores@senda.internal',
    'Admin#2026',
    'Rector Flores',
    'ADMIN'
  ),
  public.create_senda_auth_user_if_missing(
    'alejandra-pena@senda.internal',
    'Conta#2026',
    'Alejandra Peña',
    'ACCOUNTING'
  ),
  public.create_senda_auth_user_if_missing(
    'emp-001@senda.internal',
    'Head#2026',
    'Ing. Edy Echenique',
    'DEPT_HEAD',
    NULL,
    'EMP-001',
    d.dept_uv
  ),
  public.create_senda_auth_user_if_missing(
    'emp-002@senda.internal',
    'Head#2026',
    'Bismark Tinoco',
    'DEPT_HEAD',
    NULL,
    'EMP-002',
    d.dept_mt
  ),
  public.create_senda_auth_user_if_missing(
    '20240101@senda.internal',
    '20240101',
    'Marvin Moncada',
    'STUDENT',
    '20240101',
    NULL,
    d.dept_uv
  ),
  public.create_senda_auth_user_if_missing(
    '20240202@senda.internal',
    '20240202',
    'Santiago Zuniga',
    'STUDENT',
    '20240202',
    NULL,
    d.dept_uv
  ),
  public.create_senda_auth_user_if_missing(
    '20240303@senda.internal',
    '20240303',
    'Yefry Benitez',
    'STUDENT',
    '20240303',
    NULL,
    d.dept_mt
  )
FROM d;

-- 4) Asignar jefes a departamentos
UPDATE public.departments dep
SET head_id = p.id
FROM public.profiles p
WHERE dep.name = 'U Virtual'
  AND p.employee_number = 'EMP-001';

UPDATE public.departments dep
SET head_id = p.id
FROM public.profiles p
WHERE dep.name = 'Mantenimiento'
  AND p.employee_number = 'EMP-002';

-- 5) Tarifa por hora (historial)
WITH admin_user AS (
  SELECT id FROM public.profiles WHERE role = 'ADMIN' ORDER BY created_at ASC LIMIT 1
)
INSERT INTO public.hourly_rates (rate, effective_date, created_by)
SELECT x.rate, x.effective_date, a.id
FROM admin_user a
CROSS JOIN (
  VALUES
    (1200::numeric, DATE '2025-01-01'),
    (1300::numeric, DATE '2025-07-01'),
    (1500::numeric, DATE '2026-01-01')
) AS x(rate, effective_date)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.hourly_rates r
  WHERE r.rate = x.rate
    AND r.effective_date = x.effective_date
);

-- 6) Limpiar logs previos de los estudiantes seed (idempotencia)
DELETE FROM public.work_logs wl
USING public.profiles p
WHERE wl.student_id = p.id
  AND p.carnet IN ('20240101', '20240202', '20240303');

-- 7) Insertar work logs representativos (PENDING/APPROVED/PROCESSED/REJECTED)
WITH map_ids AS (
  SELECT
    (SELECT id FROM public.profiles WHERE carnet = '20240101' LIMIT 1) AS s1,
    (SELECT id FROM public.profiles WHERE carnet = '20240202' LIMIT 1) AS s2,
    (SELECT id FROM public.profiles WHERE carnet = '20240303' LIMIT 1) AS s3,
    (SELECT id FROM public.departments WHERE name = 'U Virtual' LIMIT 1) AS dept_uv,
    (SELECT id FROM public.departments WHERE name = 'Mantenimiento' LIMIT 1) AS dept_mt
),
seed_logs AS (
  SELECT * FROM (VALUES
    -- Ciclo 2026-03
    ('20240101', DATE '2026-02-26', 4::numeric,  'Actualización de plataforma Moodle y migración de cursos.', 'APPROVED',  NULL),
    ('20240101', DATE '2026-02-28', 5::numeric,  'Soporte técnico en videoconferencia para docentes.',          'PENDING',   NULL),
    ('20240101', DATE '2026-03-03', 6::numeric,  'Diseño de material educativo digital para Teología.',        'REJECTED',  'Las horas registradas no coinciden con el horario acordado.'),
    ('20240101', DATE '2026-03-07', 3::numeric,  'Revisión y configuración de exámenes en Moodle.',            'PENDING',   NULL),

    ('20240202', DATE '2026-02-27', 6::numeric,  'Diseño de interfaz para nuevo módulo de matrículas.',        'APPROVED',  NULL),
    ('20240202', DATE '2026-03-01', 4::numeric,  'Reunión de planificación semestral con coordinadores.',      'APPROVED',  NULL),
    ('20240202', DATE '2026-03-05', 5::numeric,  'Revisión de contenidos del cuatrimestre de Comunicación.',   'PENDING',   NULL),
    ('20240202', DATE '2026-03-10', 3::numeric,  'Capacitación en herramientas digitales para docentes.',      'PENDING',   NULL),

    ('20240303', DATE '2026-02-26', 8::numeric,  'Pintura de aulas del edificio central y pasillos.',          'PROCESSED', NULL),
    ('20240303', DATE '2026-03-02', 7::numeric,  'Reparación de luminarias en pasillos y salones.',            'APPROVED',  NULL),
    ('20240303', DATE '2026-03-08', 6::numeric,  'Jardinería y mantenimiento de áreas verdes del campus.',     'APPROVED',  NULL),
    ('20240303', DATE '2026-03-12', 5::numeric,  'Instalación de extintores nuevos en edificios A y B.',       'PENDING',   NULL),

    -- Historial 2026-02
    ('20240101', DATE '2026-01-28', 8::numeric,  'Migración de cursos a nueva versión de Moodle.',             'PROCESSED', NULL),
    ('20240101', DATE '2026-02-10', 6::numeric,  'Soporte a estudiantes en proceso de matrícula en línea.',    'PROCESSED', NULL),
    ('20240202', DATE '2026-01-30', 7::numeric,  'Diseño de evaluaciones en línea para cursos cuatrimestrales.','PROCESSED', NULL),
    ('20240202', DATE '2026-02-12', 8::numeric,  'Desarrollo de recursos educativos para curso propedéutico.', 'PROCESSED', NULL),
    ('20240303', DATE '2026-01-27', 10::numeric, 'Revisión y mantenimiento del sistema eléctrico del campus.', 'PROCESSED', NULL),
    ('20240303', DATE '2026-02-15', 9::numeric,  'Pintura de paredes y estructuras externas del edificio A.',  'PROCESSED', NULL),

    -- Historial 2025
    ('20240101', DATE '2025-02-15', 4::numeric,  'Actualización de plataforma Moodle.',                         'PROCESSED', NULL),
    ('20240101', DATE '2025-02-16', 5::numeric,  'Soporte a docente en videoconferencia.',                     'APPROVED',  NULL),
    ('20240202', DATE '2025-02-15', 6::numeric,  'Diseño de interfaz para nuevo curso.',                       'PROCESSED', NULL),
    ('20240303', DATE '2025-02-24', 7::numeric,  'Jardinería y limpieza de áreas verdes.',                     'REJECTED',  'Horas no coinciden con el registro de entrada.')
  ) AS t(carnet, work_date, hours, description, status, rejection_reason)
)
INSERT INTO public.work_logs (student_id, department_id, date, hours, description, status, rejection_reason)
SELECT
  CASE
    WHEN l.carnet = '20240101' THEN m.s1
    WHEN l.carnet = '20240202' THEN m.s2
    WHEN l.carnet = '20240303' THEN m.s3
  END AS student_id,
  CASE
    WHEN l.carnet IN ('20240101', '20240202') THEN m.dept_uv
    WHEN l.carnet = '20240303' THEN m.dept_mt
  END AS department_id,
  l.work_date,
  l.hours,
  l.description,
  l.status::work_log_status,
  l.rejection_reason
FROM seed_logs l
CROSS JOIN map_ids m;

COMMIT;
