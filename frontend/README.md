# SENDA Frontend

Aplicación React + Vite del sistema SENDA.

## Arquitectura

El frontend **no accede a Supabase directo**.
Consume la API del backend en `../backend`:

- Base URL local: `http://localhost:4000`
- Rutas API: `/api/v1/*`

## Variables de entorno (`frontend/.env`)

- `VITE_API_BASE_URL` (opcional en local, default proxy a `http://localhost:4000`)
- `VITE_API_VERSION` (opcional, default `v1`)

## Comandos (dentro de `frontend/`)

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run lint`
- `npm run test`

## Comando recomendado (desde raíz)

Para levantar backend + frontend juntos, usar en la raíz del repo:

- `npm run dev`

## Estructura principal

- `api/` → cliente HTTP y token manager
- `services/` → capa de acceso a datos por API REST
- `screens/` → portales por rol
- `hooks/` → estado/lógica de UI
- `components/` → UI/layout
