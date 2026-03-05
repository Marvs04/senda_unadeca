# Frontend (React + Vite)

Este archivo concentra lo de frontend de SENDA.

## Estado actual (2026-03-04)

- Arquitectura activa: `frontend -> backend API (/api/v1/*) -> Supabase`.
- El frontend no debe incluir llamadas directas a Supabase para flujos de negocio.
- La autenticaciÃ³n vigente se resuelve por API (`/auth/login`, `/auth/me`, `/auth/logout`) con bearer token en `TokenManager`.
- Cualquier documentaciÃ³n previa que describa acceso directo a Supabase desde componentes/hook se considera histÃ³rica.

## Estado actual

- Autenticación real contra backend API (`/api/v1/auth/*`) desde `services/authService.ts`.
- Carga de datos por servicios conectados a backend API:
  - `services/userService.ts`
  - `services/workLogService.ts`
  - `services/departmentService.ts`
  - `services/rateService.ts`
- `App.tsx` separa flujo no autenticado (pantalla de login) y área autenticada por rol.

## Variables necesarias (frontend)

En `.env` o `.env.local`:

- `VITE_API_BASE_URL` (opcional en local con proxy)
- `VITE_API_VERSION` (opcional, por defecto `v1`)

## Estructura frontend principal

- `screens/` → portales por rol y login.
- `hooks/` → estado y lógica por feature.
- `components/` → UI y layout.
- `services/` → capa de acceso a datos (HTTP a backend).
- `api/` → cliente HTTP, token manager y helpers de request.

## Nota importante

La base de datos se accede solo desde `backend/`; el frontend no debe incluir cliente directo de Supabase.
