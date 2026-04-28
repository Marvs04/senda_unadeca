/**
 * api/index.ts
 *
 * Barrel export del cliente HTTP.
 * Importar desde aquí en los servicios que consumen el backend API.
 *
 * NOTA: __mocks__.ts es interno a los servicios y no se re-exporta desde aquí.
 */

export { apiClient, request, TokenManager, ApiError } from './apiClient';
export type { ApiResponse, RequestMethod, RequestOptions } from './apiClient';
