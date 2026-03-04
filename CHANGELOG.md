# Changelog SENDA

## 2026-03-04

### Arquitectura y base de datos
- Reorganización del proyecto en `frontend/` y `backend/` con flujo completo **Frontend → Backend API → Supabase**.
- Endpoints y modelo de perfiles reforzados para soportar cuentas activas/inactivas (`is_active`).
- Migración SQL agregada para `profiles.is_active`.
- Seed SQL generado desde mocks del frontend para poblar datos iniciales consistentes.

### Administración
- Corrección de login para evitar apertura automática de demo en credenciales inválidas.
- Alta de estudiantes habilitada en portal Admin.
- Gestión completa de usuarios (estudiantes/jefes): editar, activar, desactivar y eliminar.
- Eliminación de departamentos habilitada con validación de integridad cuando hay bitácoras asociadas.

### Contabilidad
- Nueva experiencia por libros de departamento con desglose por estudiante.
- Búsqueda por nombre/carnet y métricas ampliadas (bruto, diezmo, neto, horas).
- Gráficas monocromáticas y resúmenes por período/cuatrimestre.
- Exportación PDF por departamento con totales por bloque.
- Normalización de render de moneda CRC en PDF para evitar símbolos corruptos.

### CI/CD y despliegue
- Workflow de GitHub Actions para despliegue de GitHub Pages desde rama `presenta`.
- Soporte de `VITE_BASE_PATH` en Vite para publicar bajo subruta del repositorio.
- Ajuste de dependencias ESLint para resolver conflicto de peers en `npm ci` del pipeline.
- Script `lint` en raíz restaurado para compatibilidad con hook de Husky.

### Integración de ramas
- Merge de `develop` hacia `presenta` completado, preservando cambios previos de `v1` y la lógica conectada a base de datos.

---

Si quieres, puedo convertir este changelog en formato por versión (por ejemplo `v1.1.0`, `v1.2.0`) y dejarlo listo para releases de GitHub.
