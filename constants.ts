/**
 * constants.ts
 *
 * Configuración global de la aplicación.
 * Valores que cambian entre entornos deben venir de variables de entorno (.env).
 *
 * Los datos de prueba (usuarios, departamentos, registros) se encuentran en:
 *   → api/__mocks__.ts  ⚠️ TEMPORAL
 */

/** Tarifa horaria base en colones. En producción vendrá del endpoint GET /rate. */
export const HOURLY_RATE = 1500;

/** Porcentaje de diezmo aplicado al pago bruto. */
export const TITHE_PERCENTAGE = 0.10; // 10 %

/**
 * Contraseña de autorización para modificar la tarifa.
 * ⚠️ TEMPORAL — reemplazar con flujo de autenticación real (roles + JWT).
 */
export const ADMIN_RATE_PASSWORD = 'admin123';
