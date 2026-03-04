/**
 * lib/env.ts
 *
 * Valida variables de entorno del frontend.
 *
 * En esta arquitectura el frontend consume una API backend (`/api/v1`).
 * Si `VITE_API_BASE_URL` no está definida, Vite proxy usa `http://localhost:4000`.
 *
 * Importa este módulo en index.tsx para que la validación ocurra antes de
 * renderizar cualquier componente.
 */

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const env = {
  apiBaseUrl:       VITE_API_BASE_URL ?? '',
  isDev:            import.meta.env.DEV    as boolean,
  isProd:           import.meta.env.PROD   as boolean,
} as const;
