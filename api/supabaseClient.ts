/**
 * api/supabaseClient.ts
 *
 * Cliente de Supabase para SENDA.
 *
 * ─── INSTRUCCIONES DE ACTIVACIÓN ────────────────────────────────────────────
 * 1. En Supabase → Settings → API, copia la Project URL y la anon public key.
 * 2. Crea el archivo .env.local en la raíz del proyecto con:
 *
 *      VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
 *      VITE_SUPABASE_ANON_KEY=<tu-anon-key>
 *
 * 3. En cada servicio (/services/*Service.ts):
 *      a. Descomenta el bloque "Real (Supabase):".
 *      b. Elimina el "return Promise.resolve(MOCK_*);" debajo.
 *      c. Cuando TODOS los servicios estén activos, elimina api/__mocks__.ts.
 *
 * 4. Para auth: en auth.ts, usa supabase.auth.signInWithPassword() y
 *    supabase.auth.signOut(). El JWT de Supabase ya viaja automáticamente
 *    en las queries — no es necesario TokenManager para Supabase.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ─── ESQUEMA DE TABLAS SUPABASE REQUERIDO ───────────────────────────────────
 *
 * Tabla: users
 *   id              uuid  PK default gen_random_uuid()
 *   name            text  NOT NULL
 *   role            text  NOT NULL  CHECK (role IN ('SUPER_ADMIN','ADMIN','DEPT_HEAD','STUDENT','ACCOUNTING'))
 *   carnet          text  UNIQUE
 *   employee_number text  UNIQUE
 *   department_id   uuid  FK → departments(id) ON DELETE SET NULL
 *   created_at      timestamptz DEFAULT now()
 *   updated_at      timestamptz DEFAULT now()
 *
 * Tabla: departments
 *   id        uuid  PK default gen_random_uuid()
 *   name      text  NOT NULL
 *   head_id   uuid  FK → users(id) ON DELETE SET NULL
 *
 * Tabla: work_logs
 *   id               uuid  PK default gen_random_uuid()
 *   student_id       uuid  NOT NULL FK → users(id)
 *   department_id    uuid  NOT NULL FK → departments(id)
 *   date             date  NOT NULL
 *   hours            numeric(5,2) NOT NULL CHECK (hours > 0)
 *   description      text  NOT NULL CHECK (char_length(description) <= 200)
 *   status           text  NOT NULL DEFAULT 'PENDING'
 *                          CHECK (status IN ('PENDING','APPROVED','REJECTED','PROCESSED'))
 *   rejection_reason text  CHECK (char_length(rejection_reason) <= 150)
 *   created_at       timestamptz DEFAULT now()
 *   updated_at       timestamptz DEFAULT now()
 *
 * Tabla: hourly_rates
 *   id             uuid  PK default gen_random_uuid()
 *   rate           numeric(10,2) NOT NULL CHECK (rate > 0)
 *   effective_date date  NOT NULL DEFAULT CURRENT_DATE
 *   created_by     uuid  FK → users(id)
 *   created_at     timestamptz DEFAULT now()
 *
 * ─── RLS RECOMENDADO ────────────────────────────────────────────────────────
 * Habilita Row Level Security en todas las tablas.
 * Usa el rol del usuario (almacenado en auth.users metadata o en public.users)
 * para definir políticas de visibilidad.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import type { UserRole, WorkLogStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Tipos de las tablas Supabase (snake_case — tal como las devuelve la API).
 * El código del frontend usa camelCase; la capa de servicios hace la conversión.
 */
export interface SupabaseUser {
  id: string;
  name: string;
  role: string;
  carnet?: string | null;
  employee_number?: string | null;
  department_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseDepartment {
  id: string;
  name: string;
  head_id?: string | null;
}

export interface SupabaseWorkLog {
  id: string;
  student_id: string;
  department_id: string;
  date: string;
  hours: number;
  description: string;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseHourlyRate {
  id: string;
  rate: number;
  effective_date: string;
  created_by?: string | null;
  created_at: string;
}

/** Map de las tablas del esquema — para evitar strings dispersos. */
export const TABLES = {
  USERS:        'users',
  DEPARTMENTS:  'departments',
  WORK_LOGS:    'work_logs',
  RATES:        'hourly_rates',
} as const;

// ─── Client ───────────────────────────────────────────────────────────────────

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Cliente singleton de Supabase.
 *
 * Si las variables de entorno no están configuradas, las operaciones fallarán
 * en tiempo de ejecución — no en módulo-load — para no romper el modo mock.
 *
 * Para usar auth de Supabase, llama a:
 *   supabase.auth.signInWithPassword({ email, password })
 *   supabase.auth.signOut()
 *   supabase.auth.getSession()
 *
 * El token JWT se inyecta automáticamente en todas las queries de Supabase.
 */
export const supabase = createClient(
  supabaseUrl  ?? 'https://placeholder.supabase.co',
  supabaseKey  ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

// ─── snake_case ↔ camelCase helpers ──────────────────────────────────────────

/** Convierte un SupabaseUser a la interfaz User del frontend. */
export function mapUser(row: SupabaseUser) {
  return {
    id:             row.id,
    name:           row.name,
    role:           row.role as UserRole,
    carnet:         row.carnet         ?? undefined,
    employeeNumber: row.employee_number ?? undefined,
    departmentId:   row.department_id   ?? undefined,
  };
}

/** Convierte un SupabaseDepartment a la interfaz Department del frontend. */
export function mapDepartment(row: SupabaseDepartment) {
  return {
    id:     row.id,
    name:   row.name,
    headId: row.head_id ?? undefined,
  };
}

/** Convierte un SupabaseWorkLog a la interfaz WorkLog del frontend. */
export function mapWorkLog(row: SupabaseWorkLog) {
  return {
    id:              row.id,
    studentId:       row.student_id,
    departmentId:    row.department_id,
    date:            row.date,
    hours:           row.hours,
    description:     row.description,
    status:          row.status as WorkLogStatus,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

/** Verifica si las variables de Supabase están configuradas. */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey &&
    supabaseUrl !== 'https://placeholder.supabase.co');
}
