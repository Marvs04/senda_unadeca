/**
 * lib/env.ts
 *
 * Valida las variables de entorno requeridas al arranque.
 *
 * En DEV:  muestra un warning (los mocks de Supabase siguen funcionando).
 * En PROD: lanza un Error — no se puede arrancar sin las vars configuradas.
 *
 * Importa este módulo en index.tsx para que la validación ocurra antes de
 * renderizar cualquier componente.
 */

const VITE_SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string | undefined;
const VITE_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const missing: string[] = [];

if (!VITE_SUPABASE_URL)      missing.push('VITE_SUPABASE_URL');
if (!VITE_SUPABASE_ANON_KEY) missing.push('VITE_SUPABASE_ANON_KEY');

if (missing.length > 0) {
  const msg =
    `[SENDA] Variables de entorno faltantes: ${missing.join(', ')}.\n` +
    `Crea el archivo .env.local en la raíz del proyecto con:\n` +
    `  VITE_SUPABASE_URL=https://<proyecto>.supabase.co\n` +
    `  VITE_SUPABASE_ANON_KEY=<anon-key>`;

  if (import.meta.env.DEV) {
    // En desarrollo los mocks reemplazan Supabase — solo advertimos.
    console.warn(msg + '\n(Modo desarrollo: usando datos mock)');
  } else {
    // En producción es un error fatal.
    throw new Error(msg);
  }
}

export const env = {
  supabaseUrl:      VITE_SUPABASE_URL      ?? '',
  supabaseAnonKey:  VITE_SUPABASE_ANON_KEY ?? '',
  isDev:            import.meta.env.DEV    as boolean,
  isProd:           import.meta.env.PROD   as boolean,
} as const;
