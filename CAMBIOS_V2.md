# SENDA — Documento de Cambios Completos (Rama `v.2`)

> **Repositorio:** `Marvs04/senda_unadeca`
> **Rama base:** `main`
> **Rama de cambios:** `v.2`
> **Fecha de corte:** 30 de abril de 2026
> **Resumen:** 265 archivos modificados · +25 468 líneas agregadas · −5 994 líneas eliminadas

---

## Tabla de Contenidos

1. [Reestructuración del Proyecto](#1-reestructuración-del-proyecto)
2. [Backend — Arquitectura Feature-Based](#2-backend--arquitectura-feature-based)
3. [Frontend — Reorganización y Nuevas Pantallas](#3-frontend--reorganización-y-nuevas-pantallas)
4. [Base de Datos — Nuevas Migraciones](#4-base-de-datos--nuevas-migraciones)
5. [Sistema de Bloqueos de Sesión (`session_locks`)](#5-sistema-de-bloqueos-de-sesión-session_locks)
6. [Sesiones Activas en Tiempo Real (`active_timer_sessions`)](#6-sesiones-activas-en-tiempo-real-active_timer_sessions)
7. [Módulo de Contabilidad (mejoras)](#7-módulo-de-contabilidad-mejoras)
8. [Flujo de Cambio de Contraseña Obligatorio](#8-flujo-de-cambio-de-contraseña-obligatorio)
9. [Notificaciones por Correo Electrónico](#9-notificaciones-por-correo-electrónico)
10. [Realtime — Habilitación Total](#10-realtime--habilitación-total)
11. [Infraestructura y Despliegue](#11-infraestructura-y-despliegue)
12. [Correcciones de PDF y Fuentes](#12-correcciones-de-pdf-y-fuentes)
13. [Tooling, Calidad y Documentación](#13-tooling-calidad-y-documentación)
14. [Listado de Commits Incluidos](#14-listado-de-commits-incluidos)

---

## 1. Reestructuración del Proyecto

### Antes (`main`)
El código del frontend vivía en la raíz del repositorio (archivos como `App.tsx`, `api/`, `hooks/`, `screens/`, `services/`, `lib/`, etc. sueltos en la raíz).

### Después (`v.2`)
Todo el proyecto fue reorganizado bajo el monorepo `senda/`:

```
senda/
├── backend/          ← API Express + Supabase (Node.js ESM)
├── frontend/         ← React + Vite + TypeScript
├── package.json      ← Workspace raíz con scripts de monorepo
├── CHANGELOG.md
└── commitlint.config.js

deploy/
└── docker-compose.yml  ← Orquestación Docker para producción
```

**Archivos eliminados de la raíz** (movidos o reemplazados):
- `App.tsx`, `api/index.ts`, `api/supabaseClient.ts`
- `hooks/` (todos), `screens/` (todos), `services/` (todos), `lib/` (todos)
- `vite.config.ts`, `tsconfig.json`, `package.json` raíz → reemplazados por las versiones dentro de `senda/`

**Beneficios:**
- Separación clara de responsabilidades frontend/backend.
- Scripts npm unificados en la raíz del monorepo.
- Dockerfile independiente por servicio.

---

## 2. Backend — Arquitectura Feature-Based

### Estructura completa

```
senda/backend/src/
├── main.mjs                          ← Punto de entrada (carga app.mjs)
├── app.mjs                           ← Express app, middlewares globales, rutas
├── features/
│   ├── accounting/
│   │   ├── accounting.controller.mjs
│   │   ├── accounting.repository.mjs
│   │   ├── accounting.routes.mjs
│   │   └── accounting.service.mjs   ← Lógica de nómina, CxC, config contable
│   ├── activeTimerSessions/
│   │   ├── activeTimerSessions.controller.mjs
│   │   ├── activeTimerSessions.repository.mjs
│   │   ├── activeTimerSessions.routes.mjs
│   │   └── activeTimerSessions.service.mjs
│   ├── auth/
│   │   ├── auth.controller.mjs
│   │   ├── auth.repository.mjs
│   │   ├── auth.routes.mjs
│   │   ├── auth.schemas.mjs
│   │   └── auth.service.mjs         ← Login, changePassword, logout
│   ├── departments/
│   │   ├── departments.controller.mjs
│   │   ├── departments.repository.mjs
│   │   ├── departments.routes.mjs
│   │   ├── departments.schemas.mjs
│   │   └── departments.service.mjs
│   ├── kiosk/
│   │   ├── kiosk.controller.mjs
│   │   ├── kiosk.repository.mjs
│   │   ├── kiosk.routes.mjs
│   │   ├── kiosk.schemas.mjs
│   │   └── kiosk.service.mjs        ← 590 líneas: lógica de kiosko completa
│   ├── rates/
│   ├── reports/
│   │   └── reports.service.mjs      ← 286 líneas: generación de reportes PDF
│   ├── sessionLocks/
│   │   ├── sessionLocks.controller.mjs
│   │   ├── sessionLocks.repository.mjs
│   │   ├── sessionLocks.routes.mjs
│   │   └── sessionLocks.service.mjs ← NUEVO: gestión de bloqueos de sesión
│   ├── users/
│   │   └── users.service.mjs        ← 353 líneas: CRUD completo + emails
│   └── workLogs/
│       └── workLogs.service.mjs     ← 205 líneas: bitácoras con auditoría
└── shared/
    ├── config/
    │   ├── logger.mjs
    │   ├── mailer.mjs               ← NUEVO: envío de correos SMTP/Resend
    │   └── supabaseClient.mjs       ← Clientes anon + service_role (adminSupabase)
    ├── errors/
    │   └── AppError.mjs
    ├── middleware/
    │   ├── errorHandler.mjs
    │   └── requireAuth.mjs
    └── utils/
        └── __tests__/
            ├── mappers.test.mjs     ← 132 líneas de tests
            └── normalize.test.mjs   ← 86 líneas de tests
```

### Cambios críticos por feature

#### `auth`
- `changePassword` ahora usa `adminSupabase.auth.admin.updateUserById` para bypassear RLS y actualizar la contraseña del usuario correctamente.
- Al completar el cambio de contraseña, limpia el flag `must_change_password = false` en el perfil.

#### `users`
- Alta de usuarios envía correo de bienvenida con credenciales temporales.
- Validación obligatoria del dominio `@unadeca.net` para `institutionalEmail`.
- Al crear usuario, se activa `must_change_password = true` para forzar cambio en primer login.
- Reset de contraseña también activa el flag y notifica por correo.

#### `sessionLocks` *(NUEVO)*
- CRUD completo para bloqueos de horario por departamento.
- El controlador usa `adminSupabase` para bypassear RLS al listar bloqueos.
- Validación de zona horaria: fechas almacenadas como `TIMESTAMP WITH TIME ZONE`.
- Corrección de bug de timezone en la respuesta del controller.

#### `activeTimerSessions` *(NUEVO)*
- Repositorio con JOIN a `profiles` para enriquecer la respuesta con nombre del estudiante.
- Migración de tabla `active_timer_sessions` incluida.

#### `kiosk`
- `SUPER_ADMIN` puede desactivar cualquier kiosko de departamento.
- Registro de horas enriquecido: envía `entrySource`, `startTime` y `endTime`.

---

## 3. Frontend — Reorganización y Nuevas Pantallas

### Nuevas pantallas / componentes

#### Portal del Jefe de Departamento (`screens/depthead/`)

| Archivo | Descripción |
|---|---|
| `DeptHeadLiveSessionsSection.tsx` | **NUEVO** — Panel de sesiones activas en tiempo real, siempre visible, con estado vacío y tarjetas mejoradas |
| `DeptHeadSessionLocksSection.tsx` | **NUEVO** — Gestión de bloqueos de sesión: crear, listar y eliminar rangos de bloqueo |
| `DeptHeadHistorySection.tsx` | **NUEVO** — Historial de bitácoras con filtros y ordenamiento |
| `DeptHeadPendingSection.tsx` | Reescrita (+180 líneas): aprobación/rechazo individual y masivo con auditoría |
| `DeptHeadPortal.tsx` | Refactorizado (+262 líneas): integra todas las secciones, navegación por tabs |

#### Portal de Contabilidad (`screens/accounting/`)

| Archivo | Descripción |
|---|---|
| `AccountingConfigModal.tsx` | **NUEVO** — Modal de configuración con tabs: tarifa, día de cierre, importación CxC |
| `AccountingSummaryTable.tsx` | **NUEVO** — Tabla resumen de totales por departamento |
| `StudentDetailModal.tsx` | **NUEVO** — Modal de detalle financiero por estudiante (291 líneas) |
| `AccountingPortal.tsx` | Reescrita desde cero (+774 líneas): nueva arquitectura con KPIs, gráficas, exportación PDF por depto |
| `AccountingPayrollTable.tsx` | Reescrita (+742 líneas): tabla de nómina con filtros, paginación y acciones |
| `AccountingCharts.tsx` | Refactorizado (+108 líneas netas): gráficas mejoradas |

#### Portal Admin (`screens/admin/`)

| Archivo | Descripción |
|---|---|
| `AdminDashboardTab.tsx` | Reescrita (+697 líneas): Dashboard Global con filtros avanzados, modal de detalle, auditoría |
| `AdminStudentsTab.tsx` | Reescrita (+470 líneas): filtros, ordenamiento, paginación (15 filas), búsqueda ampliada |
| `AdminDeptHeadsTab.tsx` | Reescrita (+409 líneas): mismo tratamiento que estudiantes |
| `AdminDepartmentsTab.tsx` | Reescrita (+267 líneas): gestión completa con centro de costos |
| `AdminPortal.tsx` | Refactorizado (+200 líneas) |

#### Portal SuperAdmin (`screens/superadmin/`)

| Archivo | Descripción |
|---|---|
| `SuperAdminPortal.tsx` | Reescrita (+542 líneas): tabs completos, gestión centralizada |
| `SuperAdminDepartmentList.tsx` | **NUEVO** — CRUD de departamentos en tabla con menú de acciones |
| `SuperAdminAccountList.tsx` | Reescrita (+258 líneas): avatares por rol, activar/desactivar con modal |
| `SuperAdminCreateForm.tsx` | Reescrita (+192 líneas): soporte para todos los roles (5 tipos) |
| `SuperAdminStudentHelp.tsx` | Reescrita (+269 líneas): tabla con menú de acciones |

#### Portal del Estudiante (`screens/student/`)

| Archivo | Descripción |
|---|---|
| `StudentPortal.tsx` | Reescrita (+230 líneas): UX mejorada, label de rol corregido |
| `StudentTimer.tsx` | Reescrita (+173 líneas): envía `entrySource`, `startTime`, `endTime` |

#### `LoginScreen.tsx`
- Reescrita (+181 líneas).
- Elimina modo demo roto.
- Muestra modal de cambio de contraseña obligatorio en primer login.

#### `ChangePasswordModal.tsx` *(NUEVO)*
- Modal dedicado para el flujo de primer login o cambio forzado.
- Se integra en `App.tsx` y `LoginScreen.tsx`.

### Nuevos hooks

| Hook | Descripción |
|---|---|
| `useActiveSessions.ts` | Suscripción realtime a `active_timer_sessions` |
| `useSessionLocks.ts` | CRUD de bloqueos de sesión |
| `useAdminDashboardStats.ts` | KPIs para el dashboard de admin |
| `useAdminRateUpdate.ts` | Actualización de tarifa con validación de rol |
| `useAccountingReport.ts` | Generación de reportes contables |
| `useDeptHeadData.ts` | Datos agregados para el portal del jefe de departamento |
| `useStudentFilter.ts` | Filtrado y búsqueda de estudiantes |
| `useConfirm.ts` | Hook de confirmación para diálogos destructivos |
| `useDebounce.ts` | Debounce genérico para inputs de búsqueda |

### Nuevos servicios frontend

| Servicio | Descripción |
|---|---|
| `activeTimerSessionsService.ts` | Endpoints de sesiones activas |
| `sessionLocksService.ts` | CRUD de bloqueos de sesión |
| `reportsService.ts` | Generación de reportes (94 líneas) |
| `accountingService.ts` | Operaciones del módulo contable |

### Nuevas librerías (`lib/`)

| Archivo | Descripción |
|---|---|
| `realtime.ts` | Helpers para suscripciones Supabase Realtime (87 líneas) |
| `accountingTxt.ts` | Exportación en formato TXT para contabilidad (163 líneas) |
| `pdf.ts` | Reescrito (+385 líneas): soporte de fuentes Noto Sans, render de ₡ y caracteres con tilde |
| `utils.ts` | Ampliado (+147 líneas) |

### Recursos estáticos (`public/fonts/`)

Se agregaron las siguientes fuentes para renderizado correcto de PDF:

| Archivo | Uso |
|---|---|
| `NotoSans-Regular.ttf` | Render de ₡ y caracteres acentuados en PDF (759 KB) |
| `NotoSans-Bold.ttf` | Versión bold de la fuente anterior (708 KB) |
| `DejaVuSans.ttf` | Fuente alternativa (759 KB) |
| `DejaVuSans-Bold.ttf` | Versión bold (708 KB) |

### Imágenes y branding

| Archivo | Descripción |
|---|---|
| `public/senda_logo_blue.png` | Logo SENDA azul (102 KB) |
| `public/send_logo_login.png` | Logo para pantalla de login (51 KB) |

---

## 4. Base de Datos — Nuevas Migraciones

### Migraciones existentes (de referencia)

| # | Archivo | Descripción |
|---|---|---|
| 001 | `20260303_001_senda_full_schema.sql` | Schema completo inicial |
| 002 | `20260304_002_profiles_is_active.sql` | Campo `is_active` en perfiles |
| 003 | `20260304_003_admin_requirements_and_worklog_audit.sql` | Requisitos admin, auditoría de bitácoras |
| 004 | `20260305_004_enable_realtime_for_core_tables.sql` | Realtime tablas núcleo |
| 005 | `20260317_005_accounting_config_and_cost_center.sql` | Config contable, centro de costos |
| 006 | `20260317_006_student_receivables.sql` | Cuentas por cobrar |
| 007 | `20260317_007_relax_cost_center_constraints.sql` | Flexibilización de restricciones |
| 008 | `20260412_008_accounting_closing_day.sql` | Día de cierre configurable |

### Migraciones **NUEVAS** en `v.2`

#### `20260428_active_timer_sessions.sql`
Crea la tabla `active_timer_sessions` para rastrear sesiones de temporización activas de estudiantes en tiempo real.

#### `20260429_009_must_change_password.sql`
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
```
- Propósito: forzar cambio de contraseña en primer login o tras reset por admin.
- `DEFAULT false` para usuarios existentes.
- El backend lo activa en `createUser` y `resetPassword`.
- El backend lo desactiva en `changePassword`.

#### `20260429_010_session_locks_table.sql`
Crea la tabla `session_locks` para bloquear rangos de tiempo en que los estudiantes pueden registrar horas:

```sql
CREATE TABLE session_locks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id  UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime   TIMESTAMP WITH TIME ZONE NOT NULL,
  reason         TEXT,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_datetime_range CHECK (start_datetime < end_datetime)
);
```

**Políticas RLS:**
| Política | Rol | Operación |
|---|---|---|
| `super_admin_view_all_locks` | SUPER_ADMIN | SELECT todos |
| `dept_head_view_own_dept_locks` | DEPT_HEAD | SELECT solo su depto |
| `dept_head_create_own_dept_locks` | DEPT_HEAD | INSERT en su depto |
| `super_admin_create_any_locks` | SUPER_ADMIN | INSERT en cualquier depto |
| `dept_head_delete_own_locks` | DEPT_HEAD | DELETE los propios |
| `super_admin_delete_any_locks` | SUPER_ADMIN | DELETE cualquiera |

**Índices creados:**
- `idx_session_locks_department_id`
- `idx_session_locks_created_by`
- `idx_session_locks_datetime` (compuesto: `start_datetime`, `end_datetime`)

#### `20260429_011_enable_realtime_all_tables.sql`
Habilita `REPLICA IDENTITY FULL` y agrega a la publicación `supabase_realtime` las tablas que no estaban cubiertas por la migración 004:
- `kiosk_state`
- `kiosk_sessions`
- `accounting_config`
- `student_receivables`
- `active_timer_sessions`
- `session_locks`

---

## 5. Sistema de Bloqueos de Sesión (`session_locks`)

### Descripción
Permite a los Jefes de Departamento (y Super Admin) definir rangos de fecha/hora en que los estudiantes **no pueden** registrar nuevas horas en ese departamento.

### Flujo
```
DEPT_HEAD crea bloqueo
    ↓
Backend (sessionLocks.service) valida rango y persiste con adminSupabase
    ↓
Tabla session_locks (con RLS)
    ↓
Realtime notifica cambio
    ↓
Frontend (useSessionLocks) actualiza lista
    ↓
Panel DeptHeadSessionLocksSection muestra bloqueos activos
```

### API Endpoints
| Método | Ruta | Rol requerido |
|---|---|---|
| `GET` | `/api/v1/session-locks?departmentId=:id` | DEPT_HEAD, SUPER_ADMIN |
| `POST` | `/api/v1/session-locks` | DEPT_HEAD, SUPER_ADMIN |
| `DELETE` | `/api/v1/session-locks/:id` | DEPT_HEAD (propio), SUPER_ADMIN |

### Corrección de Timezone
Bug corregido: el controller devolvía las fechas sin respetar la zona horaria de Costa Rica (UTC-6). Ahora se almacenan como `TIMESTAMP WITH TIME ZONE` y se devuelven correctamente.

---

## 6. Sesiones Activas en Tiempo Real (`active_timer_sessions`)

### Descripción
Panel visible permanentemente en el portal del Jefe de Departamento que muestra qué estudiantes tienen una sesión de cronómetro activa en ese momento.

### Características
- **Siempre visible**: el panel se muestra aunque no haya sesiones activas (estado vacío con mensaje informativo).
- **Tarjetas mejoradas**: cada tarjeta muestra nombre del estudiante, carnet, hora de inicio y duración transcurrida.
- **Actualización en tiempo real**: suscripción Supabase Realtime al canal `active_timer_sessions`.
- **JOIN con profiles**: el repositorio backend hace JOIN para incluir datos del perfil del estudiante.

### Bug corregido
El JOIN en `activeTimerSessions.repository.mjs` usaba una sintaxis incorrecta de Supabase. Se corrigió para obtener `profiles` relacionados correctamente.

---

## 7. Módulo de Contabilidad (mejoras)

### Configuración (`AccountingConfigModal`)
- **Tab Tarifa**: editar la tarifa hora-beca con validación.
- **Tab Día de Cierre**: configurar el día del mes en que cierra el período contable.
- **Tab Importar CxC**: importar cuentas por cobrar desde archivo CSV.

### Funcionalidades nuevas
- Exportación en **formato TXT** (`lib/accountingTxt.ts`) para integración con sistemas contables externos.
- Modal de detalle por estudiante (`StudentDetailModal`) con historial de horas y montos.
- Tabla resumen (`AccountingSummaryTable`) con totales agregados por departamento.
- KPIs en el portal: bruto total, diezmo, neto, horas totales del período.

### Correcciones
- Se procesa únicamente el subconjunto de pagos **seleccionados** (no todos).
- Corrupción del símbolo `₡` en PDF eliminada en todos los contextos (`renderDeptGroupedPDF`, celdas individuales).

---

## 8. Flujo de Cambio de Contraseña Obligatorio

### Problema resuelto
Al crear un usuario o resetear su contraseña, el sistema ahora obliga al usuario a cambiar su contraseña antes de acceder a las funciones del sistema.

### Implementación

**Base de datos:**
```sql
profiles.must_change_password BOOLEAN NOT NULL DEFAULT false
```

**Backend:**
- `createUser` → establece `must_change_password = true` en el perfil.
- `resetPassword` → establece `must_change_password = true`.
- `changePassword` → usa `adminSupabase.auth.admin.updateUserById` (bypasea RLS) y limpia el flag.

**Frontend:**
- `LoginScreen.tsx` → tras login exitoso, verifica `must_change_password` en el perfil.
- Si es `true`, muestra `ChangePasswordModal` bloqueando el acceso al portal.
- El modal llama a `authService.changePassword` y al completarse redirige al portal correspondiente.

---

## 9. Notificaciones por Correo Electrónico

### Nuevo módulo: `mailer.mjs`
Implementado en `senda/backend/src/shared/config/mailer.mjs` (373 líneas).

#### Funcionalidades
- Envío de correo de **bienvenida/credenciales** al crear un usuario nuevo.
- Notificación de **reset de contraseña** con nueva contraseña temporal.
- Plantillas HTML con estilo institucional SENDA/UNADECA.

#### Configuración SMTP
El servicio soporta dos proveedores configurables vía variables de entorno:

| Variable | Descripción |
|---|---|
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Puerto (587 para STARTTLS, 465 para SSL) |
| `SMTP_USER` | Usuario de autenticación |
| `SMTP_PASS` | Contraseña |
| `SMTP_SENDER_NAME` | Nombre del remitente |
| `SMTP_FROM` | Dirección del remitente |

#### Historial de proveedores SMTP
1. **Office 365** (`smtp.office365.com:587`) — configuración inicial.
2. **Resend** (`smtp.resend.com:465`) — migrado en commit `d0e5d82`, con `requireTLS` en puerto 587.
3. **Configuración actual en producción:** Office 365 (`virtual.machine@unadeca.net`).

### Validación de dominio institucional
- Al crear usuarios, el campo `institutionalEmail` solo acepta direcciones `@unadeca.net`.
- Validación en frontend (formulario de creación) y backend (schema de usuarios).

---

## 10. Realtime — Habilitación Total

### Estado anterior
Solo las tablas núcleo tenían Realtime habilitado (migración 004).

### Estado actual
**Todas** las tablas del sistema tienen `REPLICA IDENTITY FULL` y están en la publicación `supabase_realtime`:

| Tabla | Migración |
|---|---|
| `profiles` | 004 |
| `departments` | 004 |
| `work_logs` | 004 |
| `kiosk_state` | 011 *(nueva)* |
| `kiosk_sessions` | 011 *(nueva)* |
| `accounting_config` | 011 *(nueva)* |
| `student_receivables` | 011 *(nueva)* |
| `active_timer_sessions` | 011 *(nueva)* |
| `session_locks` | 011 *(nueva)* |

### Nuevo helper de Realtime (`lib/realtime.ts`)
- Factory function para crear suscripciones tipadas.
- Cleanup automático al desmontar componentes.
- Soporte para múltiples canales simultáneos.

### Sincronización de `accounting_config`
- El frontend se suscribe en tiempo real a cambios en `accounting_config`.
- Cuando un usuario actualiza la tarifa o el día de cierre, todos los portales reflejan el cambio instantáneamente.

---

## 11. Infraestructura y Despliegue

### `deploy/docker-compose.yml` *(NUEVO — 56 líneas)*

Orquesta dos servicios dentro de la red `stamp-net` (externa, compartida con Supabase self-hosted):

#### Servicio `senda-backend`
```yaml
build:
  context: ../senda/backend
  dockerfile: Dockerfile
image: senda-backend:latest
restart: unless-stopped
environment:
  PORT: 4000
  SUPABASE_URL: http://senda-kong:8000      # Kong API Gateway interno
  CORS_ORIGIN: https://senda.rlp.lat
  SITE_URL: https://senda.rlp.lat
  SMTP_HOST: smtp.office365.com
  SMTP_PORT: 587
healthcheck:
  test: wget -qO- http://localhost:4000/health
  interval: 10s
  timeout: 5s
  retries: 3
```

#### Servicio `senda-frontend`
```yaml
build:
  context: ../senda/frontend
  dockerfile: Dockerfile
  args:
    VITE_API_VERSION: v1
    VITE_SUPABASE_URL: https://sendasupabaseapi.rlp.lat
image: senda-frontend:latest
restart: unless-stopped
depends_on:
  senda-backend:
    condition: service_healthy   # El frontend espera que el backend esté healthy
```

### `senda/backend/Dockerfile` *(NUEVO — 12 líneas)*
Imagen multi-stage optimizada para producción Node.js.

### `senda/frontend/Dockerfile` *(NUEVO)*
Build de Vite + nginx para servir el SPA.

### `senda/frontend/nginx.conf` *(NUEVO — 28 líneas)*
Configuración nginx con:
- `try_files $uri /index.html` para SPA routing.
- Headers de caché para assets estáticos.
- Protección contra que nginx devuelva HTML cuando el browser solicita fuentes (fix para PDF).

### Variables de entorno del frontend (build-time)
| Variable | Descripción |
|---|---|
| `VITE_API_VERSION` | Versión de la API (`v1`) |
| `VITE_SUPABASE_URL` | URL del Supabase self-hosted |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase |

---

## 12. Correcciones de PDF y Fuentes

### Problema raíz
El PDF generado con jsPDF mostraba `â‚¡` en lugar de `₡` y caracteres con tilde corruptos porque la fuente por defecto de jsPDF no incluye Unicode extendido.

### Solución implementada
1. Se agregaron las fuentes **Noto Sans Regular** y **Noto Sans Bold** en `public/fonts/`.
2. `lib/pdf.ts` fue reescrito para:
   - Cargar las fuentes con `addFileToVFS` y `addFont` de jsPDF.
   - Usar Noto Sans como fuente por defecto en todos los documentos.
   - Guard contra redirección SPA: antes de usar el archivo de fuente, se verifica que el Content-Type sea `font/ttf` o `application/octet-stream`, no `text/html`.
3. Eliminación de sanitización manual del símbolo `₡` (ya no necesaria con la fuente correcta).

### Contextos corregidos
- PDF de nómina por departamento (`renderDeptGroupedPDF`).
- PDF de reporte global de horas.
- PDF de reporte del Jefe de Departamento.
- Todas las celdas de moneda en tablas PDF.

---

## 13. Tooling, Calidad y Documentación

### Copilot Skills (`.github/skills/`)
Se agregaron 13 archivos de skills para GitHub Copilot con guías de arquitectura del proyecto:

| Skill | Descripción |
|---|---|
| `api-versioning` | Convenciones de versionado de API |
| `architecture-preservation` | Reglas para preservar la arquitectura |
| `backend-layer-responsibility` | Responsabilidades por capa (controller/service/repo) |
| `backend-naming-conventions` | Convenciones de nombres en backend |
| `centralized-error-handling` | Manejo centralizado de errores |
| `codebase-migration-strategy` | Estrategia de migración de código |
| `feature-based-architecture` | Arquitectura basada en features |
| `feature-independence` | Independencia entre features |
| `logging-rules` | Reglas de logging |
| `realtime-subscription-pattern` | Patrón de suscripciones Realtime |
| `repository-pattern-enforcement` | Patrón repositorio obligatorio |
| `safe-refactoring-rules` | Reglas de refactoring seguro |
| `shared-utilities-rule` | Regla de utilidades compartidas |

### `.github/copilot-instructions.md` *(NUEVO — 93 líneas)*
Instrucciones globales de Copilot para el proyecto, incluyendo:
- Stack tecnológico y convenciones.
- Restricciones arquitectónicas.
- Patrones obligatorios.

### Husky + Commitlint
- `.husky/commit-msg` — valida formato de commits.
- `.husky/pre-commit` — ejecuta lint antes de commit.
- `.husky/pre-push` — ejecuta tests antes de push.
- `senda/commitlint.config.js` — configuración de reglas de commits.

### Tests unitarios
| Archivo | Líneas | Descripción |
|---|---|---|
| `backend/src/shared/utils/__tests__/mappers.test.mjs` | 132 | Tests de mappers de datos |
| `backend/src/shared/utils/__tests__/normalize.test.mjs` | 86 | Tests de normalización |
| `frontend/lib/__tests__/utils.test.ts` | 107 | Tests de utilidades frontend |
| `frontend/lib/__tests__/business.test.ts` | — | Tests de lógica de negocio |

### `senda/package.json` *(NUEVO — monorepo raíz)*
Scripts de workspace:
```json
{
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "dev:frontend": "...",
    "dev:backend": "...",
    "test": "...",
    "lint": "..."
  }
}
```

### GitHub Actions
- `senda/.github/workflows/deploy-pages-presenta.yml` — Workflow para despliegue a GitHub Pages desde la rama `presenta` (62 líneas).

---

## 14. Listado de Commits Incluidos

| Hash | Fecha | Descripción |
|---|---|---|
| `e3e0d2d` | 2026-04-29 | chore: guardar cambios actuales |
| `d03a794` | 2026-04-29 | Merge remote-tracking branch 'origin/0.1_M' into v.2 |
| `faea3e4` | 2026-04-29 | fix(pdf): guard against SPA 404-redirect serving HTML as font; fix session lock timezone |
| `92a3d25` | 2026-04-29 | fix(pdf): load Noto Sans font to render ₡ and Spanish accented characters correctly |
| `0d69d13` | 2026-04-29 | fix: session-locks controller use adminSupabase to bypass RLS |
| `18e13dc` | 2026-04-28 | feat: redesign live sessions panel — always visible, empty state, improved cards |
| `6c4b078` | 2026-04-28 | fix: active_timer_sessions join + add session_locks migration |
| `199ed89` | 2026-04-29 | feat(realtime): enable realtime on all tables + sync accounting_config |
| `71f9420` | 2026-04-29 | fix(merge): post-merge integration fixes |
| `5e3dbce` | 2026-04-28 | feat: session locks, live student sessions, accounting fix, image deploy fix |
| `11fc31d` | 2026-04-28 | Fix: Process only selected accounting payments + Feature: Session locks infrastructure |
| `5d1e378` | 2026-04-29 | fix(auth): changePassword use adminSupabase.auth.admin.updateUserById |
| `10ca705` | 2026-04-29 | chore(migrations): 009 add must_change_password to profiles |
| `a2b1090` | 2026-04-29 | feat: email redesign, first-login password change flow |
| `d0e5d82` | 2026-04-29 | chore(smtp): switch to Resend via smtp.resend.com:465 |
| `738f7a3` | 2026-04-29 | feat(frontend): require institutionalEmail @unadeca.net on user creation |
| `9334b51` | 2026-04-28 | feat(users): add email notifications and enforce @unadeca.net domain |
| `3689eb0` | 2026-04-28 | feat: restructure project layout and fix self-hosted Supabase auth |
| `8116057` | 2026-04-26 | chore: repo cleanup, tooling setup, bug fixes, and project docs |
| `0c4f8ec` | 2026-04-13 | fix(logo): override SVG width/height to 100% so it scales to container |
| `56afeb9` | 2026-04-13 | feat(student): UX improvements + fix role label + accounting table consistency |
| `5bec877` | 2026-04-12 | fix(pdf): eliminate colon currency corruption in all PDF reports |
| `a0da42e` | 2026-04-12 | feat(accounting): importacion CxC, dia de cierre configurable, PDF por depto, fix logo |
| `a2b3c36` | 2026-04-12 | feat(accounting): UX overhaul - Exportar dropdown, KPI subtitles, chart improvements |
| `9b96989` | 2026-04-12 | feat(brand): SENDA logo SVG + test suite for admin filters |
| `13e6137` | 2026-04-12 | feat(admin): filters + sort for students/dept-heads, search for departments |
| `70d4565` | 2026-04-12 | style(admin): comprehensive UX overhaul for Admin portal |
| `2a3407b` | 2026-04-12 | feat(admin): paginate all tables to 15 rows per page |
| `c5bf071` | 2026-04-12 | refactor(superadmin): dedicated department list with table layout and actions menu |
| `eb108f7` | 2026-04-12 | feat(superadmin): add full department CRUD management |
| `cd70624` | 2026-04-12 | feat(superadmin): activate/deactivate users with confirmation modal |
| `1ac8a1a` | 2026-04-12 | style(superadmin): UX polish — card subtitles, collapsible kiosk, role avatars, action menu |
| `a07a006` | 2026-04-12 | feat(superadmin): create form supports all account types (5 roles) |
| `b0b619b` | 2026-04-12 | feat(accounting): full accounting module with config, receivables and reports |
| `5e3b581` | 2026-04-12 | fix: resolve 6 bugs across auth, kiosk, dept-head and student flows |
| `6f2b44f` | 2026-03-17 | feat(kiosk): implement REST API and connect frontend service |
| `13a6610` | 2026-03-05 | feat: backend feature-based architecture + server-side payroll reports |
| `6b2e097` | 2026-03-05 | fix: standardize Costa Rica time and hour-only displays |
| `0f377eb` | 2026-03-05 | feat: enable supabase realtime and subscribe core hooks |
| `cd6fc50` | 2026-03-05 | feat: enforce admin requirements and add worklog audit detail flow |
| `2210b9f` | 2026-03-04 | feat: harden auth flows and fix frontend-backend consistency |
| `7aad2a1` | 2026-03-04 | feat: allow admin to delete departments from UI and API |
| `db34613` | 2026-03-04 | feat: admin can edit, activate/deactivate and delete student/dept-head accounts |
| `6a264dd` | 2026-03-04 | feat: reorganize workspace into frontend/backend and wire full backend API flow |

---

*Documento generado el 30 de abril de 2026 — rama `v.2` · `Marvs04/senda_unadeca`*
