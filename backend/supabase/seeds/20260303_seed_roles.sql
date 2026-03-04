BEGIN;

INSERT INTO public.departments (name)
VALUES ('U Virtual'), ('Mantenimiento')
ON CONFLICT (name) DO NOTHING;

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

WITH d AS (
  SELECT
    (SELECT id FROM public.departments WHERE name = 'U Virtual' LIMIT 1)      AS dept_uv,
    (SELECT id FROM public.departments WHERE name = 'Mantenimiento' LIMIT 1)  AS dept_mt
)
SELECT
  public.create_senda_auth_user_if_missing(
    'superadmin@senda.internal',
    'SuperAdmin#2026',
    'Super Admin',
    'SUPER_ADMIN'
  ),
  public.create_senda_auth_user_if_missing(
    'admin@senda.internal',
    'Admin#2026',
    'Administrador General',
    'ADMIN'
  ),
  public.create_senda_auth_user_if_missing(
    'contabilidad@senda.internal',
    'Conta#2026',
    'Contabilidad Principal',
    'ACCOUNTING'
  ),
  public.create_senda_auth_user_if_missing(
    'emp-1001@senda.internal',
    'Head#2026',
    'Jefe U Virtual',
    'DEPT_HEAD',
    NULL,
    'EMP-1001',
    d.dept_uv
  ),
  public.create_senda_auth_user_if_missing(
    '20260001@senda.internal',
    'Student#2026',
    'Estudiante Demo',
    'STUDENT',
    '20260001',
    NULL,
    d.dept_uv
  )
FROM d;

UPDATE public.departments dep
SET head_id = p.id
FROM public.profiles p
WHERE dep.name = 'U Virtual'
  AND p.employee_number = 'EMP-1001';

COMMIT;
