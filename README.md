# SENDA — Sistema de Horas Beca (UNADECA)

SENDA (*Sistema Estratégico de Navegación y Desempeño Asistencial*) digitaliza el flujo completo de horas beca:

1. Estudiantes registran horas
2. Jefes de departamento aprueban/rechazan
3. Administración gestiona usuarios/departamentos/tarifa
4. Contabilidad procesa planilla
5. Super Admin administra cuentas globales

## Arquitectura actual

**Frontend -> Backend API -> Supabase**

- `frontend/` → React + Vite
- `backend/` → Node + Express (API REST)
- `backend/supabase/migrations/` → esquema SQL
- `backend/supabase/seeds/` → seeds (incluye cuentas de roles)

> El frontend no consulta Supabase directamente; todo acceso a BD pasa por la API de `backend/`.

## Roles del sistema

- `SUPER_ADMIN`
- `ADMIN`
- `DEPT_HEAD`
- `STUDENT`
- `ACCOUNTING`

## Comandos principales (desde raíz)

- `npm run dev` → inicia backend + frontend (limpia puertos antes de iniciar)
- `npm run dev:backend` → inicia solo backend
- `npm run dev:frontend` → inicia solo frontend
- `npm run stop` → cierra puertos de desarrollo (`3000-3002`, `4000`)
- `npm run restart` → reinicia todo (`stop` + `dev:core`)
- `npm run typecheck` → valida TypeScript del frontend

## URLs locales

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Health backend: `http://localhost:4000/health`

## Variables de entorno

### Backend (`backend/.env`)

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT` (opcional, default `4000`)
- `CORS_ORIGIN` (opcional, default `http://localhost:3000`)

Plantilla: `backend/.env.example`.

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL` (opcional en local; si no está, usa proxy a `http://localhost:4000`)
- `VITE_API_VERSION` (opcional, default `v1`)

## Inicio rápido

1. Configura `backend/.env`
2. Ejecuta `npm install` en raíz
3. Ejecuta `npm run dev`
4. Abre `http://localhost:3000`

## Documentación por capa

- Frontend: `frontend/README.md` y `frontend/FRONTEND_SPEC.md`
- Backend: `backend/README.md` y `backend/BACKEND_SPEC.md`

## Registro de cambios

- Historial consolidado de cambios recientes: `CHANGELOG.md`
