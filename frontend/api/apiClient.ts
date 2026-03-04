/**
 * api/apiClient.ts
 *
 * Cliente HTTP centralizado para SENDA.
 * Maneja autenticación, normalización de errores y ciclo de vida completo
 * de las peticiones (loading → success | error).
 *
 * ─── TOKEN SETUP (cuando JWT esté listo) ────────────────────────────────────
 *   1. Descomentar las líneas de TokenManager en buildHeaders().
 *   2. Llamar TokenManager.set(token) después de un login exitoso.
 *   3. Llamar TokenManager.clear() en logout.
 *   4. Si el backend devuelve 401, TokenManager.clear() + redirect a login.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const API_VER  = import.meta.env.VITE_API_VERSION  ?? 'v1';

/** Prefijo completo para todas las rutas: e.g. "https://api.senda.edu/api/v1" */
export const API_PREFIX = `${API_BASE}/api/${API_VER}`;

// ─── Token Manager ────────────────────────────────────────────────────────────

const TOKEN_KEY = 'senda_token';

/**
 * Gestión del JWT en localStorage.
 * Deshabilitado hasta que el backend de autenticación esté listo.
 */
export const TokenManager = {
  /** Devuelve el token almacenado o null si no existe. */
  get: (): string | null => localStorage.getItem(TOKEN_KEY),

  /** Guarda el token tras un login exitoso. */
  set: (token: string): void => { localStorage.setItem(TOKEN_KEY, token); },

  /** Elimina el token en logout o sesión expirada. */
  clear: (): void => { localStorage.removeItem(TOKEN_KEY); },
} as const;

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * Error enriquecido con código HTTP y código de error interno.
 * Los hooks lo capturan y exponen como `error: string`.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string = 'API_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: true;
}

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  /** Query string params — se serializan automáticamente. */
  params?: Record<string, string | number | boolean>;
  /** AbortController.signal para cancelar la petición. */
  signal?: AbortSignal;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildHeaders(): HeadersInit {
  const token = TokenManager.get();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function withParams(
  url: string,
  params?: Record<string, string | number | boolean>,
): string {
  if (!params || Object.keys(params).length === 0) return url;
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  return `${url}?${qs}`;
}

async function parseBody<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) return res.json() as Promise<T>;
  // 204 No Content o respuestas sin cuerpo
  return undefined as unknown as T;
}

// ─── Core request ─────────────────────────────────────────────────────────────

/**
 * Función base para todas las peticiones HTTP.
 *
 * Estados del ciclo de vida:
 *   • loading  — la promesa está pendiente (quien llama gestiona este estado)
 *   • success  — la promesa resuelve con { data, status, ok: true }
 *   • error    — la promesa rechaza con ApiError
 *
 * Los hooks (useWorkLogs, useUsers, etc.) consumen esta función y exponen
 * `isLoading` y `error` al componente.
 */
export async function request<T = unknown>(
  method: RequestMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const url = withParams(`${API_PREFIX}${path}`, options.params);

  const init: RequestInit = {
    method,
    headers: buildHeaders(),
    signal: options.signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  try {
    const res = await fetch(url, init);

    if (!res.ok) {
      // Intenta extraer mensaje de error del cuerpo JSON
      let message = `HTTP ${res.status}`;
      try {
        const errBody = await res.json() as { message?: string; error?: string };
        message = errBody.message ?? errBody.error ?? message;
      } catch {
        // No es JSON — usar mensaje genérico
      }

      // 401: limpiar token y forzar re-login
      if (res.status === 401) {
        TokenManager.clear();
        // window.location.href = '/login'; // descomentar cuando auth esté listo
      }

      throw new ApiError(message, res.status);
    }

    const data = await parseBody<T>(res);
    return { data, status: res.status, ok: true };

  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Petición cancelada', 0, 'ABORTED');
    }

    throw new ApiError(
      err instanceof Error ? err.message : 'Error desconocido',
      0,
      'NETWORK_ERROR',
    );
  }
}

// ─── Convenience methods ──────────────────────────────────────────────────────

/**
 * Cliente HTTP tipado.
 *
 * Uso en servicios:
 *   const { data } = await apiClient.get<User[]>('/users');
 *   const { data } = await apiClient.post<WorkLog>('/work-logs', payload);
 */
export const apiClient = {
  get:   <T>(path: string, opts?: RequestOptions) =>
    request<T>('GET', path, undefined, opts),

  post:  <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>('POST', path, body, opts),

  put:   <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>('PUT', path, body, opts),

  patch: <T>(path: string, body: unknown, opts?: RequestOptions) =>
    request<T>('PATCH', path, body, opts),

  del:   <T = void>(path: string, opts?: RequestOptions) =>
    request<T>('DELETE', path, undefined, opts),
} as const;
