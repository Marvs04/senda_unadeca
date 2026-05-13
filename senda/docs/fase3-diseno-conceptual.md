# FASE 3 — Diseño Conceptual

**Proyecto:** SENDA — Sistema Estratégico de Navegación y Desempeño Asistencial  
**Institución:** UNADECA  
**Versión:** 1.0  
**Fecha:** Abril 2026

> **Nota:** Esta fase documenta el diseño **implementado** en el sistema SENDA existente. Dado que la aplicación ya se encuentra desarrollada y funcionando, las secciones de interfaz de usuario describen las pantallas reales implementadas, en lugar de wireframes o maquetas conceptuales.

---

## Índice

1. [Diseño de Arquitectura](#1-diseño-de-arquitectura)
2. [Diseño a Nivel de Componentes](#2-diseño-a-nivel-de-componentes)
3. [Diseño de Interfaz de Usuario](#3-diseño-de-interfaz-de-usuario)
4. [Patrones de Diseño Identificados](#4-patrones-de-diseño-identificados)

---

## 1. Diseño de Arquitectura

### 1.1 Visión General — Modelo Cliente-Servidor en Capas

SENDA sigue una arquitectura **cliente-servidor de tres capas** (presentación, lógica de negocio, datos) con separación física entre el frontend y el backend, ambos conectados a Supabase como plataforma de datos y autenticación.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CAPA DE PRESENTACIÓN                          │
│                                                                       │
│   Browser / SPA (React 19 + Vite + TypeScript + Tailwind CSS 4)      │
│                                                                       │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│   │ Student  │ │DeptHead  │ │  Admin   │ │SuperAdmin│ │Accounting│ │
│   │ Portal   │ │ Portal   │ │  Portal  │ │  Portal  │ │  Portal  │ │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│   ┌─────────────────────────────────────────────────────────────────┐│
│   │   Kiosk Screen (terminal compartida)                            ││
│   └─────────────────────────────────────────────────────────────────┘│
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS + JWT (Bearer Token)
                                │ fetch() / Supabase JS Realtime
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAPA DE LÓGICA DE NEGOCIO                         │
│                                                                       │
│   API REST — Node.js 20 + Express 4 (ESM .mjs)                       │
│                                                                       │
│   Middleware:  requireAuth → getRequesterProfile → feature handler   │
│                                                                       │
│   Features:                                                           │
│   ┌──────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌────────┐ ┌────────────┐  │
│   │ auth │ │users │ │ depts │ │rates │ │  kiosk │ │  reports   │  │
│   └──────┘ └──────┘ └───────┘ └──────┘ └────────┘ └────────────┘  │
│   ┌────────────┐ ┌─────────────┐                                     │
│   │ work_logs  │ │ accounting  │                                     │
│   └────────────┘ └─────────────┘                                     │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ Supabase JS Admin Client
                                │ (service_role key)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CAPA DE DATOS                                   │
│                                                                       │
│   Supabase (BaaS — Backend as a Service)                             │
│                                                                       │
│   ┌─────────────────────────┐  ┌──────────────────────────────────┐  │
│   │  PostgreSQL             │  │  Supabase Auth                   │  │
│   │                         │  │  (JWT, signIn, getUser)          │  │
│   │  profiles               │  └──────────────────────────────────┘  │
│   │  departments            │                                         │
│   │  work_logs              │  ┌──────────────────────────────────┐  │
│   │  rates                  │  │  Supabase Realtime               │  │
│   │  kiosk_state            │  │  (LISTEN/NOTIFY → websocket)     │  │
│   │  kiosk_sessions         │  │  Tablas: work_logs, kiosk_*      │  │
│   │  accounting_config      │  └──────────────────────────────────┘  │
│   │  receivables            │                                         │
│   └─────────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Comunicación entre Capas

| Dirección | Protocolo | Mecanismo | Autenticación |
|---|---|---|---|
| Frontend → Backend API | HTTPS | `fetch()` con JSON | Bearer JWT (Supabase token) |
| Backend → Supabase | HTTPS | `@supabase/supabase-js` | `service_role` key (admin) |
| Frontend → Supabase Realtime | WebSocket | Suscripciones JS SDK | `anon` key |
| Kiosk → Supabase Auth | HTTPS | `signInWithPassword` | Credenciales usuario final |

### 1.3 Arquitectura Interna del Backend

El backend aplica una arquitectura **feature-based (vertical slice)**. Cada característica tiene su propia carpeta con las siguientes capas:

```
src/features/{feature}/
    ├── {feature}.routes.mjs      ← Definición de rutas Express
    ├── {feature}.controller.mjs  ← Manejo HTTP (req/res), sin lógica
    ├── {feature}.service.mjs     ← Lógica de negocio y validaciones
    ├── {feature}.repository.mjs  ← Acceso a datos (Supabase queries)
    └── {feature}.schemas.mjs     ← Constantes, validaciones de entrada

src/shared/
    ├── config/
    │   ├── supabaseClient.mjs    ← Instancias anon y admin de Supabase
    │   └── logger.mjs            ← Wrapper de console para logging
    ├── errors/
    │   └── AppError.mjs          ← Clase de error con statusCode
    ├── middleware/
    │   ├── requireAuth.mjs       ← Validación JWT + perfil del requester
    │   └── errorHandler.mjs      ← Middleware global de errores Express
    └── utils/
        ├── mappers.mjs           ← snake_case → camelCase (toUser, toWorkLog…)
        ├── normalize.mjs         ← Normalización de entradas opcionales
        └── regex.mjs             ← Expresiones regulares compartidas
```

**Flujo de una petición HTTP típica:**

```
Request HTTPS
    │
    ▼
[Express Router]
    │ Middleware: requireAuth
    │  → Extrae JWT del header Authorization
    │  → Valida token con Supabase Auth
    │  → Adjunta supabase client y authUser al req
    ▼
[Controller]
    │  → Llama a getRequesterProfile(req) para obtener perfil completo
    │  → Invoca función del service con los parámetros del req
    ▼
[Service]
    │  → Valida roles y permisos de negocio
    │  → Aplica reglas de negocio
    │  → Llama funciones del repository
    ▼
[Repository]
    │  → Ejecuta queries en Supabase (select, insert, update, delete)
    │  → Retorna { data, error } sin lanzar excepciones
    ▼
[Service]
    │  → Maneja errores de DB (lanza AppError con statusCode)
    │  → Mapea resultados usando mappers.mjs
    ▼
[Controller]
    │  → Retorna res.json(data) o res.sendStatus(204)
    ▼
Response HTTPS
```

### 1.4 Estrategia de Autenticación Dual (Quiosco)

El quiosco implementa una autenticación de **doble capa** para operaciones sensibles:

1. **Capa 1 — JWT global:** Todas las rutas del backend requieren un JWT válido (middleware `requireAuth`). El frontend del quiosco mantiene su propia sesión autenticada.
2. **Capa 2 — Re-autenticación por credenciales:** Las operaciones del quiosco (clock-in, clock-out, cancelar sesión) requieren que el usuario ingrese sus credenciales en el cuerpo de la solicitud. El backend crea un cliente Supabase temporal con las credenciales del usuario final para validarlas sin afectar la sesión global.

---

## 2. Diseño a Nivel de Componentes

### 2.1 Módulos del Frontend

El frontend está organizado como una **SPA por rol**, donde el componente raíz (`App.tsx`) determina qué portal renderizar según el rol del usuario autenticado.

#### 2.1.1 Estructura de directorios

```
frontend/
├── api/
│   ├── apiClient.ts         ← fetch() wrapper con auth headers y manejo de errores
│   └── apiClient.test.ts
├── services/                ← Una función por endpoint de la API
│   ├── authService.ts
│   ├── workLogService.ts
│   ├── kioskService.ts
│   ├── userService.ts
│   ├── departmentService.ts
│   ├── rateService.ts
│   ├── reportService.ts
│   └── accountingService.ts
├── hooks/                   ← Custom hooks de estado por dominio
│   ├── useWorkLogs.ts       ← Estado global de work logs (carga + mutaciones)
│   ├── useKiosk.ts          ← Estado del quiosco con realtime
│   ├── useStudentSession.ts ← Temporizador persistido en localStorage
│   ├── useStudentFilter.ts  ← Filtrado de logs para la vista de estudiante
│   ├── useDeptHeadData.ts   ← Cálculos derivados para el portal del jefe
│   ├── useAdminUsersData.ts ← Estado de usuarios con mutaciones optimistas
│   ├── useUsers.ts
│   ├── useDepartments.ts
│   ├── useRate.ts
│   ├── useAccountingReport.ts
│   ├── useAdminRateUpdate.ts
│   ├── useAdminDashboardStats.ts
│   ├── useSuperAdminData.ts
│   ├── useConfirm.ts        ← Dialog de confirmación reutilizable
│   └── useDebounce.ts
├── screens/                 ← Portales por rol
│   ├── LoginScreen.tsx
│   ├── student/
│   ├── depthead/
│   ├── admin/
│   ├── superadmin/
│   ├── accounting/
│   └── kiosk/
├── components/
│   ├── ui/                  ← Componentes primitivos (Button, Input, Modal…)
│   ├── layout/              ← PortalLayout (barra nav + contenedor)
│   ├── DashboardCard.tsx
│   ├── WorkLogTable.tsx
│   └── ConfirmDialog.tsx
├── lib/
│   ├── utils.ts             ← formatCurrency, formatIsoDate, truncate…
│   ├── business.ts          ← getBillingCycle, isDateInCycle, getTrimester…
│   ├── pdf.ts               ← renderPDF() con jsPDF
│   └── realtime.ts          ← subscribeToTableChanges() (Supabase Realtime)
├── types.ts                 ← Interfaces TypeScript compartidas
└── constants.ts             ← TITHE_PERCENTAGE, HOURLY_RATE
```

#### 2.1.2 Descripción de Módulos Clave

| Módulo | Responsabilidad |
|---|---|
| `api/apiClient.ts` | Centraliza todas las peticiones HTTP. Adjunta el Bearer token de Supabase, maneja errores HTTP convirtiéndolos en instancias de `ApiError`. |
| `services/` | Cada archivo encapsula las llamadas a un recurso de la API. Las funciones son puras (input → Promise<output>), sin estado propio. |
| `hooks/useWorkLogs.ts` | Gestiona el estado global de work logs: carga inicial, suscripción Realtime con debounce, y mutaciones optimistas (add, updateStatus, bulkUpdateStatus). |
| `hooks/useKiosk.ts` | Gestiona el estado del quiosco activo. Expone acciones tipadas (`activate`, `clockIn`, `clockOut`, etc.) que actualizan el estado tras cada operación exitosa. Incluye re-evaluación de turnos cada minuto. |
| `hooks/useStudentSession.ts` | Controla el temporizador del estudiante. Persiste la sesión activa en `localStorage` para sobrevivir recargas. Valida límites de duración. |
| `lib/business.ts` | Funciones puras de dominio: cálculo de ciclo de facturación (`getBillingCycle`), verificación de fecha en ciclo (`isDateInCycle`), cálculo de cuatrimestre (`getTrimester`). Sin efectos secundarios, 100% testeables. |
| `lib/pdf.ts` | Genera PDFs usando jsPDF y jspdf-autotable. Recibe datos estructurados y produce un archivo descargable sin acoplarse a ninguna pantalla. |
| `components/ui/` | Biblioteca de componentes primitivos (`Button`, `Input`, `Select`, `Modal`) con variantes de estilo definidas. No contienen lógica de negocio. |
| `screens/kiosk/KioskScreen.tsx` | Terminal de quiosco con formulario de clock-in/out, lista de sesiones activas en tiempo real, gestión de turnos y desactivación. |

### 2.2 Módulos del Backend

| Feature | Descripción |
|---|---|
| `auth` | Login (Supabase signIn), logout, /me. No gestiona usuarios directamente. |
| `users` | CRUD de perfiles con validaciones de rol y autorización diferenciada por role del requester. |
| `departments` | CRUD de departamentos. Validación de asignación de jefe. |
| `rates` | Gestión del historial de tarifas horarias. GET retorna la más reciente. |
| `work_logs` | CRUD de registros de horas. Actualización de estado individual y masiva. |
| `kiosk` | Ciclo de vida completo del quiosco: activar, clock-in/out, cancelar sesión, configurar turnos, desactivar. Re-autenticación por credenciales en cada acción. |
| `reports` | Generación de nómina (por ciclo o cuatrimestre) y reporte individual por estudiante. Todos los cálculos se realizan en memoria desde los datos crudos. |
| `accounting` | Configuración contable (cuentas, día de cierre) y gestión de receivables (individual y por lote). |

### 2.3 API REST — Resumen de Endpoints

| Método | Ruta | Descripción | Roles permitidos |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Autenticación con credenciales | Público |
| GET | `/api/v1/auth/me` | Perfil del usuario autenticado | Todos |
| POST | `/api/v1/auth/logout` | Cerrar sesión | Todos |
| GET | `/api/v1/users` | Listar usuarios | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/users` | Crear usuario | ADMIN, SUPER_ADMIN |
| PATCH | `/api/v1/users/:id` | Editar usuario | ADMIN, SUPER_ADMIN |
| DELETE | `/api/v1/users/:id` | Eliminar usuario | ADMIN, SUPER_ADMIN |
| POST | `/api/v1/users/:id/reset-password` | Resetear contraseña | SUPER_ADMIN |
| GET | `/api/v1/departments` | Listar departamentos | Todos |
| POST | `/api/v1/departments` | Crear departamento | ADMIN, SUPER_ADMIN |
| PATCH | `/api/v1/departments/:id` | Editar departamento | ADMIN, SUPER_ADMIN |
| DELETE | `/api/v1/departments/:id` | Eliminar departamento | ADMIN, SUPER_ADMIN |
| GET | `/api/v1/rates` | Tarifa vigente | Todos |
| POST | `/api/v1/rates` | Registrar nueva tarifa | ADMIN, SUPER_ADMIN |
| GET | `/api/v1/work-logs` | Listar registros | Todos |
| POST | `/api/v1/work-logs` | Crear registro | Todos (rol filtra acceso) |
| PATCH | `/api/v1/work-logs/:id/status` | Cambiar estado | DEPT_HEAD, ACCOUNTING, ADMIN |
| PATCH | `/api/v1/work-logs/bulk-status` | Cambio masivo de estado | DEPT_HEAD, ADMIN |
| GET | `/api/v1/kiosk/:departmentId` | Estado del quiosco | DEPT_HEAD, SUPER_ADMIN |
| POST | `/api/v1/kiosk/activate` | Activar quiosco | DEPT_HEAD, SUPER_ADMIN |
| POST | `/api/v1/kiosk/deactivate` | Desactivar quiosco | DEPT_HEAD, SUPER_ADMIN |
| POST | `/api/v1/kiosk/clock-in` | Registrar entrada | STUDENT (via quiosco) |
| POST | `/api/v1/kiosk/clock-out` | Registrar salida | STUDENT (via quiosco) |
| POST | `/api/v1/kiosk/cancel-session` | Cancelar sesión | DEPT_HEAD, SUPER_ADMIN |
| PATCH | `/api/v1/kiosk/shifts` | Actualizar turnos | DEPT_HEAD, SUPER_ADMIN |
| GET | `/api/v1/reports/payroll` | Nómina por período | ACCOUNTING, ADMIN, SUPER_ADMIN |
| GET | `/api/v1/reports/student/:id` | Reporte individual | ACCOUNTING, ADMIN, SUPER_ADMIN |
| GET | `/api/v1/accounting/config` | Config contable | ACCOUNTING, ADMIN, SUPER_ADMIN |
| PUT | `/api/v1/accounting/config` | Actualizar config | ACCOUNTING, ADMIN, SUPER_ADMIN |
| PUT | `/api/v1/accounting/receivables` | Upsert cuenta por cobrar | ACCOUNTING, ADMIN, SUPER_ADMIN |
| PUT | `/api/v1/accounting/receivables/batch` | Upsert múltiples cobros | ACCOUNTING, ADMIN, SUPER_ADMIN |

---

## 3. Diseño de Interfaz de Usuario

> La aplicación está completamente implementada. Esta sección describe las pantallas reales del sistema, organizadas por portal de rol.

### 3.1 Pantalla de Login

**Ruta:** `/` (antes de autenticación)

**Descripción:** Pantalla de autenticación con diseño de dos columnas. La columna izquierda (oculta en móvil) muestra branding institucional con el nombre SENDA y tarjetas de características. La columna derecha contiene el formulario de login con campos de usuario/carnet y contraseña (con toggle de visibilidad). Incluye animaciones de entrada con Framer Motion.

**Elementos clave:**
- Campo de texto para usuario/carnet con autocompletado de navegador habilitado (`autocomplete="username"`).
- Campo de contraseña con botón de mostrar/ocultar.
- Botón de submit que se deshabilita durante la petición (`isSubmitting`).
- Mensaje de error en rojo bajo el formulario al fallar la autenticación.
- Footer con año dinámico y copyright.

---

### 3.2 Portal del Estudiante

**Acceso:** Usuarios con rol `STUDENT`

Compuesto por cuatro secciones organizadas en un layout de dos columnas (7/5):

#### 3.2.1 Perfil del Estudiante (`StudentProfile`)
Muestra avatar con iniciales, nombre completo, carnet, departamento asignado, y tarjetas de resumen: horas totales del ciclo, estado de la cuenta y tarifa vigente.

#### 3.2.2 Historial de Horas (`StudentHistory`)
Tabla de registros con filtro por modo (ciclo de facturación o cuatrimestre), selector de período y búsqueda. Cada fila muestra fecha, horas, descripción, estado con badge de color y razón de rechazo (si aplica). Botones de exportación CSV y PDF.

#### 3.2.3 Temporizador (`StudentTimer`)
Interfaz de reloj en tiempo real con fondo oscuro degradado. Muestra el tiempo en formato `HH:MM:SS`. Textarea para descripción (contador de caracteres visible). Botón de inicio verde y botón de finalización. Si la sesión es menor a 15 minutos, muestra un aviso con opciones de continuar o registrar igualmente.

#### 3.2.4 Panel Financiero (`StudentFinancials`)
Tarjetas con: Total Neto del ciclo, Diezmo (10%), información del próximo corte de pago con countdown en días.

---

### 3.3 Portal del Jefe de Departamento

**Acceso:** Usuarios con rol `DEPT_HEAD`

**Layout:** Cabecera con nombre del departamento, selector de ciclo (últimos 12 meses) y botón de activar quiosco. Cinco KPI cards (estudiantes, horas del ciclo, pendientes, aprobadas, facturación). Grid de dos columnas: historial + registros pendientes (8/12) y formulario de registro (4/12, sticky).

**Secciones:**
- **Pendientes:** Lista de registros PENDING con botones de aprobar/rechazar por registro y botón "Aprobar todos". Los rechazos abren un modal de razón.
- **Historial del Departamento:** Tabla filtrada por ciclo con registros aprobados y procesados. Exportación CSV/PDF.
- **Formulario de Registro Directo:** Select de estudiante, campo de fecha (date picker), campo de horas con step=0.5, textarea de descripción. El registro resultante queda en estado APPROVED inmediatamente.
- **Modal de Activación de Quiosco:** Campos de número de empleado y contraseña del jefe para activar el terminal.

---

### 3.4 Portal del Administrador

**Acceso:** Usuarios con rol `ADMIN`

**Layout:** Sidebar fijo con navegación a 4 tabs + controles de tarifa y ciclo. En móvil, los tabs se muestran como fila horizontal scrollable.

**Tabs:**
- **Dashboard:** KPI cards del ciclo (horas totales, facturación, pendientes, departamentos activos), gráfico de barras de horas por departamento, tabla de registros del ciclo.
- **Estudiantes (`AdminStudentsTab`):** Tabla con buscador, filtro por departamento, botones de editar/eliminar. Modal de creación con todos los campos del perfil del estudiante. Edición in-modal.
- **Jefes de Departamento (`AdminDeptHeadsTab`):** Similar a estudiantes pero para el rol DEPT_HEAD con campos específicos (número de empleado).
- **Departamentos (`AdminDepartmentsTab`):** Lista de departamentos con estadísticas de horas del ciclo por departamento, gestión de asignación de jefe, creación y eliminación.

**Modal de tarifa:** Formulario simple con campo numérico para actualizar la tarifa vigente, protegido por confirmación.

---

### 3.5 Portal del Super Administrador

**Acceso:** Usuarios con rol `SUPER_ADMIN`

**Layout:** Dos tabs principales con listas de gestión con capacidades de ordenamiento y búsqueda.

**Secciones:**
- **Lista de Cuentas (`SuperAdminAccountList`):** Tabla de todos los usuarios del sistema (excepto el propio SUPER_ADMIN listado por separado). Columnas ordenables por nombre, rol, estado. Botones de resetear contraseña y eliminar. Badge de estado activo/inactivo. Creación de usuarios de cualquier rol mediante `SuperAdminCreateForm`.
- **Ayuda Estudiantil (`SuperAdminStudentHelp`):** Vista de todos los estudiantes con sus estados de cuenta, departamentos y últimos registros.
- **Departamentos (`SuperAdminDepartmentList`):** Gestión completa de departamentos incluyendo asignación de jefe.

---

### 3.6 Portal de Contabilidad

**Acceso:** Usuarios con rol `ACCOUNTING`

**Layout:** Sidebar de configuración (modo, período, filtros) + área principal de contenido con tabs.

**Tabs:**
- **Tabla de Nómina (`AccountingPayrollTable`):** Tabla detallada con columnas: nombre del estudiante, carnet, departamento, horas, bruto, diezmo, cobros (cuenta por cobrar), total a pagar. Botones de editar cobros por estudiante (inline). Totales en footer de tabla.
- **Tabla de Resumen (`AccountingSummaryTable`):** Vista agregada por departamento con subtotales.
- **Gráficos (`AccountingCharts`):** Visualizaciones de horas y montos por departamento.
- **Modal de Configuración (`AccountingConfigModal`):** Configuración de cuentas contables (número y nombre), día de cierre (1–28), aplicable inmediatamente.

**Funciones especiales:**
- Selector de modo: Ciclo de facturación / Cuatrimestre.
- Selector de período con los últimos 12 ciclos o 3 cuatrimestres del año.
- Filtro por departamento y buscador por nombre de estudiante.
- Exportación de nómina completa en CSV o PDF con tabla institucional.
- Modal de detalle individual (`StudentDetailModal`): logs individuales del estudiante en el período.

---

### 3.7 Pantalla de Quiosco

**Acceso:** Activada por un DEPT_HEAD desde su portal; la URL o estado de sesión identifica el departamento activo.

**Layout:** Full-screen con fondo oscuro degradado azul profundo. Dos paneles horizontales (2/5 y 3/5).

**Panel izquierdo — Formulario de registro:**
- Título del departamento y nombre del sistema.
- Formulario con campos carnet y contraseña.
- Botón único "Registrar" que actúa como clock-in o clock-out según el estado actual.
- Texto explicativo sobre el comportamiento dual.

**Panel derecho — Lista de sesiones activas:**
- Contador de estudiantes activos.
- Lista de tarjetas por estudiante con: avatar con iniciales, nombre, carnet y cronómetro de tiempo activo.
- Botón X por sesión para iniciar cancelación (requiere credenciales del jefe).

**Header:**
- Indicador visual de turno activo (punto verde pulsante).
- Botón de configuración de turnos (abre `ShiftPanel`).
- Botón de desactivar quiosco (abre modal de confirmación con credenciales).

**Modales:**
- **CancelModal:** Solicita credenciales del jefe y razón del rechazo.
- **ShiftPanel:** CRUD de ventanas horarias con campos de hora inicio/fin.
- **Deactivate Modal:** Confirmación con credenciales para desactivar el quiosco.

---

### 3.8 Componentes UI Compartidos

| Componente | Props clave | Descripción |
|---|---|---|
| `Button` | `variant`, `size`, `icon`, `disabled` | Variantes: primary, outline, ghost, success, danger, icon-action. |
| `Input` | `label`, `type`, `icon`, `error` | Input con label flotante, ícono izquierdo opcional y mensaje de error. |
| `Select` | `label`, `options`, `value`, `onChange` | Select estilizado con opciones de tipo `{value, label}`. |
| `Modal` | `open`, `onClose`, `title`, `subtitle` | Modal con overlay, animación y contenido slot. |
| `PortalLayout` | `user`, `onLogout`, `bg` | Wrapper de página con barra de navegación institucional y botón de logout. |
| `WorkLogTable` | `logs`, `users`, `departments`, `renderActions` | Tabla de work logs reutilizable con formato de fecha, estado y acciones inyectables. |
| `DashboardCard` | `title`, `value`, `icon`, `trend` | Tarjeta de KPI con ícono, valor grande y tendencia opcional. |
| `ConfirmDialog` | `isOpen`, `message`, `onConfirm`, `onCancel` | Dialog de confirmación reutilizable, soporta variante de peligro. |

---

## 4. Patrones de Diseño Identificados

### 4.1 Patrón Repositorio (Repository Pattern)

**Implementación:** Cada feature del backend tiene su propio archivo `{feature}.repository.mjs` que encapsula todos los accesos a Supabase. El servicio nunca accede directamente al cliente de Supabase; siempre delega en el repository.

**Beneficio:** Desacoplamiento entre lógica de negocio y mecanismo de persistencia. Si en el futuro se cambia de Supabase a otra base de datos, solo se modifican los repositories, no los servicios.

**Ejemplo:**
```javascript
// kiosk.repository.mjs
export async function findStateByDept(adminSupa, departmentId) {
  return adminSupa
    .from('kiosk_state')
    .select('*, kiosk_sessions(*, profiles(*))')
    .eq('department_id', departmentId)
    .maybeSingle();
}

// kiosk.service.mjs — no importa supabase directamente
import { findStateByDept } from './kiosk.repository.mjs';
const { data, error } = await findStateByDept(adminSupa, departmentId);
```

---

### 4.2 Patrón Observer / Pub-Sub (Realtime)

**Implementación:** El módulo `frontend/lib/realtime.ts` encapsula la suscripción a cambios de Supabase. Los hooks (`useWorkLogs`, `useKiosk`) se suscriben a tablas específicas y programan un refetch con debounce de 250 ms al detectar cambios.

**Beneficio:** Las pantallas se actualizan automáticamente cuando otro usuario realiza cambios, sin necesidad de polling activo.

```typescript
// realtime.ts
export function subscribeToTableChanges({ table, onChange }) {
  const channel = supabase.channel(`table-changes-${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}
```

---

### 4.3 Patrón Optimistic UI (Frontend)

**Implementación:** En los hooks de mutación (`useWorkLogs`, `useAdminUsersData`), el estado local se actualiza de inmediato (antes de que el servidor confirme), y se revierte si la petición falla.

**Beneficio:** La interfaz parece instantánea para el usuario. Los errores de red ocasionales se manejan con rollback transparente + toast de error.

```typescript
// useWorkLogs.ts
const addWorkLog = useCallback((newLogData, status) => {
  const tempId = crypto.randomUUID();
  const newLog = { ...newLogData, id: tempId, status };
  setWorkLogs(prev => [newLog, ...prev]);        // actualización optimista
  createWorkLog(newLogData, status)
    .then(created => {
      setWorkLogs(prev => prev.map(l => l.id === tempId ? created : l));
    })
    .catch(() => {
      setWorkLogs(prev => prev.filter(l => l.id !== tempId)); // rollback
      toast.error('Error al guardar el registro.');
    });
}, []);
```

---

### 4.4 Patrón Facade (Servicios del Frontend)

**Implementación:** Los archivos en `frontend/services/` actúan como Facades sobre `apiClient.ts`. Cada función de servicio oculta los detalles de URL, método HTTP y transformación de datos detrás de una interfaz semántica.

**Beneficio:** Los hooks y componentes nunca conocen los detalles del protocolo HTTP; solo invocan funciones con nombres de dominio.

```typescript
// workLogService.ts (Facade)
export async function patchWorkLogStatus(logId, newStatus, reason) {
  return apiClient.patch(`/work-logs/${logId}/status`, { status: newStatus, rejectionReason: reason });
}
```

---

### 4.5 Patrón Strategy (Cálculo de Período)

**Implementación:** La función `isDateInCycle` y la función `isDateInTrimester` en `frontend/lib/business.ts` representan dos estrategias intercambiables para determinar si una fecha pertenece a un período dado. El selector de modo en los portales actúa como contexto que elige la estrategia.

**Beneficio:** El código de filtrado y cálculo de nómina puede cambiar la estrategia de período sin modificar la lógica que lo invoca.

---

### 4.6 Patrón Command (Acciones del Quiosco)

**Implementación:** El objeto `actions` que retorna `useKiosk` encapsula cada operación del quiosco (`activate`, `clockIn`, `clockOut`, etc.) como una función callable que incluye toda la lógica de validación, ejecución y manejo de errores. El componente `KioskScreen` solo llama acciones sin conocer los detalles.

**Beneficio:** Las acciones son unidades encapsuladas y reutilizables. El componente quiosco no gestiona estado directamente; solo invoca comandos y reacciona al resultado.

---

### Referencias Bibliográficas (APA)

Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. Addison-Wesley Professional.

Fowler, M. (2018). *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional.

React Team. (2024). *React Documentation — Hooks Reference*. https://react.dev/reference/react
