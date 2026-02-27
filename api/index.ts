/**
 * api/index.ts
 *
 * Barrel export del cliente HTTP y del cliente Supabase.
 * Importar desde aquí en los servicios que necesiten hacer peticiones reales.
 *
 * NOTA: __mocks__.ts es interno a los servicios y no se re-exporta desde aquí.
 */

export { apiClient, request, TokenManager, ApiError } from './apiClient';
export type { ApiResponse, RequestMethod, RequestOptions } from './apiClient';

export { supabase, TABLES, mapUser, mapDepartment, mapWorkLog, isSupabaseConfigured } from './supabaseClient';
export type { SupabaseUser, SupabaseDepartment, SupabaseWorkLog, SupabaseHourlyRate } from './supabaseClient';
