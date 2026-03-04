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
