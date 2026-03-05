# Backend API (Node + Express + Supabase)

Este folder concentra el backend de SENDA:

- `server.mjs` → API REST que centraliza acceso a Supabase
- `supabase/migrations/` → esquema SQL y migraciones
- `supabase/seeds/` → scripts SQL de seed (incluye roles de prueba)
- `BACKEND_SPEC.md` → especificación funcional detallada

## Variables de entorno (`backend/.env`)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (opcional, default `4000`)
- `CORS_ORIGIN` (opcional, default `http://localhost:3000`)

## Comandos

- `npm run dev` → levanta backend en modo desarrollo
- `npm run start` → backend en modo normal

## Endpoints base

- `GET /health`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `GET/POST/PATCH/DELETE /api/v1/users`
- `GET/POST/PATCH /api/v1/departments`
- `GET/POST/PATCH /api/v1/work-logs`
- `GET/PUT /api/v1/rate`

## Nota

El frontend ya no consulta Supabase directo; consume esta API.

## Runbook SQL (2026-03-04)

### 1) Ejecutar migracion

Archivo:

- `backend/supabase/migrations/20260304_003_admin_requirements_and_worklog_audit.sql`

Objetivo:

- Agrega `profiles.institutional_email` (opcional, validado, unico case-insensitive).
- Agrega `departments.cost_center` obligatorio con formato `NN-NNNN`.
- Agrega campos de auditoria en `work_logs` (`entry_source`, `start_time`, `end_time`, `approved_by/at`, `rejected_by/at`).

### 2) Verificar requeridos por rol

```sql
SELECT id, name, role, carnet, employee_number, institutional_email
FROM public.profiles
WHERE (role = 'STUDENT' AND (carnet IS NULL OR btrim(carnet) = ''))
	 OR (role = 'DEPT_HEAD' AND (employee_number IS NULL OR btrim(employee_number) = ''));
```

### 3) Verificar formato de centro de costos

```sql
SELECT id, name, cost_center
FROM public.departments
WHERE cost_center !~ '^[0-9]{2}-[0-9]{4}$';
```

### 4) Query de lectura para detalle global con auditoria

```sql
SELECT
	wl.id,
	s.name AS student_name,
	s.carnet,
	d.name AS department_name,
	d.cost_center,
	dh.name AS department_head_name,
	wl.date,
	wl.start_time,
	wl.end_time,
	wl.hours,
	wl.description,
	wl.status,
	wl.entry_source,
	ap.name AS approved_by_name,
	wl.approved_at,
	rj.name AS rejected_by_name,
	wl.rejected_at,
	wl.rejection_reason
FROM public.work_logs wl
JOIN public.profiles s ON s.id = wl.student_id
JOIN public.departments d ON d.id = wl.department_id
LEFT JOIN public.profiles dh ON dh.id = d.head_id
LEFT JOIN public.profiles ap ON ap.id = wl.approved_by
LEFT JOIN public.profiles rj ON rj.id = wl.rejected_by
ORDER BY
	wl.date DESC,
	COALESCE(wl.end_time, wl.approved_at, wl.rejected_at, wl.created_at) DESC;
```
