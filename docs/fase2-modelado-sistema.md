# FASE 2 — Modelado del Sistema

**Proyecto:** SENDA — Sistema Estratégico de Normalización y Desarrollo Académico  
**Institución:** UNADECA  
**Versión:** 1.0  
**Fecha:** Abril 2026

---

## Índice

1. [Modelo de Requerimientos](#1-modelo-de-requerimientos)
   - 1.1 [Diagrama de Casos de Uso](#11-diagrama-de-casos-de-uso)
   - 1.2 [Diagrama de Clases del Dominio](#12-diagrama-de-clases-del-dominio)
   - 1.3 [Diagramas de Flujo y Comportamiento](#13-diagramas-de-flujo-y-comportamiento)
2. [Identificación de Patrones de Análisis](#2-identificación-de-patrones-de-análisis)
3. [Modelo de Datos Inicial](#3-modelo-de-datos-inicial)

---

## 1. Modelo de Requerimientos

### 1.1 Diagrama de Casos de Uso

El siguiente diagrama representa los actores del sistema y sus casos de uso principales. Los actores heredan capacidades según jerarquía de roles: SUPER_ADMIN incluye todo lo de ADMIN; ADMIN incluye lo del usuario base.

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Sistema SENDA                                   │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Autenticación                                                    │  │
│  │   (UC-Login) ◄──── todos los actores                            │  │
│  │   (UC-Logout)                                                    │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌────────────────────┐   ┌────────────────────────────────────────┐   │
│  │   ESTUDIANTE       │   │   JEFE DE DEPARTAMENTO                 │   │
│  │                    │   │                                        │   │
│  │ ○ Registrar horas  │   │ ○ Aprobar registro                     │   │
│  │   (temporizador)   │   │ ○ Rechazar registro                    │   │
│  │ ○ Ver historial    │   │ ○ Aprobar todos (masivo)               │   │
│  │ ○ Ver financiero   │   │ ○ Registrar horas directas             │   │
│  │ ○ Clock-in quiosco │   │ ○ Activar/desactivar quiosco           │   │
│  │ ○ Clock-out quiosco│   │ ○ Cancelar sesión quiosco              │   │
│  │ ○ Exportar CSV/PDF │   │ ○ Configurar turnos quiosco            │   │
│  └────────────────────┘   │ ○ Exportar reportes dpto               │   │
│                           └────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────┐   ┌────────────────────────────────────────┐   │
│  │   ADMIN            │   │   CONTABILIDAD                         │   │
│  │                    │   │                                        │   │
│  │ ○ Crear usuario    │   │ ○ Ver nómina (ciclo / cuatrimestre)    │   │
│  │   (STUDENT/DPTHEAD)│   │ ○ Filtrar por departamento             │   │
│  │ ○ Editar usuario   │   │ ○ Gestionar cuentas por cobrar         │   │
│  │ ○ Eliminar usuario │   │ ○ Configurar cuentas contables         │   │
│  │ ○ Gestionar deptos │   │ ○ Configurar día de cierre             │   │
│  │ ○ Actualizar tarifa│   │ ○ Exportar nómina CSV/PDF              │   │
│  └────────────────────┘   │ ○ Ver reporte individual estudiante    │   │
│                           └────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │   SUPER_ADMIN                                                  │    │
│  │   (incluye todo lo de ADMIN +)                                 │    │
│  │                                                                │    │
│  │ ○ Resetear contraseñas                                         │    │
│  │ ○ Crear usuarios de cualquier rol                              │    │
│  │ ○ Activar quiosco para cualquier departamento                  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

#### Relaciones de extensión e inclusión

| Caso de uso base | Relación | Caso de uso extendido |
|---|---|---|
| Registrar horas (temporizador) | `<<include>>` | Validar descripción |
| Registrar horas (temporizador) | `<<extend>>` | Advertencia sesión corta (<15 min) |
| Clock-out quiosco | `<<include>>` | Crear work log PENDING |
| Cancelar sesión quiosco | `<<include>>` | Crear work log REJECTED |
| Desactivar quiosco | `<<include>>` | Cerrar sesiones abiertas |
| Generar nómina | `<<include>>` | Calcular bruto / diezmo / neto |
| Generar nómina | `<<extend>>` | Aplicar cuentas por cobrar |

---

### 1.2 Diagrama de Clases del Dominio

El diagrama refleja las entidades del negocio y sus relaciones tal como existen en el sistema implementado. Los tipos primitivos corresponden a la capa TypeScript del frontend; la capa backend usa las mismas estructuras mapeadas desde snake_case.

```
┌──────────────────────────────┐
│         <<enumeration>>      │
│            UserRole          │
├──────────────────────────────┤
│ SUPER_ADMIN                  │
│ ADMIN                        │
│ DEPT_HEAD                    │
│ STUDENT                      │
│ ACCOUNTING                   │
└──────────────────────────────┘
                ▲
                │ role : UserRole
                │
┌───────────────────────────────────┐
│              User                 │
├───────────────────────────────────┤
│ + id            : string (UUID)   │
│ + name          : string          │
│ + role          : UserRole        │
│ + carnet        : string?         │
│ + employeeNumber: string?         │
│ + institutionalEmail: string?     │
│ + departmentId  : string?         │
│ + isActive      : boolean         │
│ + createdAt     : string (ISO)    │
└───────────────────────────────────┘
         │                    │
         │ 0..*          0..1 │
         │                    │
         ▼                    ▼
┌────────────────────┐  ┌──────────────────────────────┐
│     WorkLog        │  │         Department            │
├────────────────────┤  ├──────────────────────────────┤
│ + id : string      │  │ + id         : string (UUID)  │
│ + studentId : str  │  │ + name       : string         │
│ + departmentId:str │  │ + headId     : string?        │
│ + date : string    │  │ + costCenter : string         │
│ + hours : number   │  └──────────────────────────────┘
│ + description: str │            │
│ + status :WorkStat │       0..* │
│ + entrySource:enum │            │
│ + startTime : str? │            ▼
│ + endTime   : str? │  ┌──────────────────────────────┐
│ + approvedBy: str? │  │         KioskState            │
│ + approvedAt: str? │  ├──────────────────────────────┤
│ + rejectedBy: str? │  │ + departmentId: string        │
│ + rejectedAt: str? │  │ + activatedBy : string        │
│ + rejectionReason? │  │ + activatedAt : string (ISO)  │
└────────────────────┘  │ + shifts      : KioskShift[] │
                        │ + sessions    : KioskSession[]│
                        └──────────────────────────────┘
                                │              │
                        1..* ───┘              └─── 1..*
                                │              │
                ┌───────────────┘              └───────────────┐
                ▼                                              ▼
┌──────────────────────────┐             ┌──────────────────────────────┐
│       KioskShift         │             │        KioskSession           │
├──────────────────────────┤             ├──────────────────────────────┤
│ + startTime : string     │             │ + studentId : string          │
│   (HH:MM, 24h)           │             │ + startedAt : string (ISO)   │
│ + endTime   : string     │             └──────────────────────────────┘
└──────────────────────────┘

┌──────────────────────────────┐
│         HourlyRate           │
├──────────────────────────────┤
│ + id            : string     │
│ + rate          : number (₡) │
│ + effectiveDate : string     │
└──────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   AccountingConfig                        │
├──────────────────────────────────────────────────────────┤
│ + id               : string                              │
│ + becasAccount     : string  (número de cuenta)          │
│ + becasName        : string                              │
│ + diezmoAccount    : string                              │
│ + diezmoName       : string                              │
│ + payableAccount   : string                              │
│ + payableName      : string                              │
│ + receivableAccount: string                              │
│ + receivableName   : string                              │
│ + closingDay       : number  (1–28)                      │
│ + updatedAt        : string (ISO)                        │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    Receivable                             │
├──────────────────────────────────────────────────────────┤
│ + id         : string                                    │
│ + studentId  : string                                    │
│ + periodKey  : string  ('cycle_YYYY-MM' | 'qN_YYYY')     │
│ + amount     : number (₡)                                │
└──────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────
Enumeraciones adicionales:

  WorkLogStatus: PENDING | APPROVED | PROCESSED | REJECTED
  EntrySource:   MANUAL | KIOSK
  LIMITS:        DESCRIPTION=200, REJECTION_REASON=150,
                 KIOSK_CANCEL_REASON=150, MAX_HOURS=12
────────────────────────────────────────────────────────────
```

#### Relaciones de asociación

| Entidad A | Multiplicidad | Entidad B | Descripción |
|---|---|---|---|
| User (STUDENT) | 0..* | WorkLog | Un estudiante puede tener muchos registros |
| Department | 0..1 | User (DEPT_HEAD) | Un departamento tiene un jefe asignado |
| Department | 0..* | User (STUDENT) | Un departamento agrupa varios estudiantes |
| Department | 0..1 | KioskState | Un departamento puede tener un quiosco activo |
| KioskState | 0..* | KioskSession | Un quiosco puede tener varias sesiones activas |
| KioskState | 0..* | KioskShift | Un quiosco tiene ventanas de turno configuradas |
| WorkLog | 0..1 | Department | Cada registro pertenece a un departamento |

---

### 1.3 Diagramas de Flujo y Comportamiento

#### 1.3.1 Flujo del ciclo de vida de un Work Log

```
                    ┌────────────┐
                    │  CREACIÓN  │
                    └────────────┘
                          │
             ┌────────────┴───────────────┐
             │                            │
             ▼                            ▼
   [Estudiante — temporizador]   [Jefe — entrada manual]
   [Kiosco — clock-out]
             │                            │
             │                            │ status = APPROVED (directo)
             ▼                            ▼
         ┌─────────┐               ┌──────────┐
         │ PENDING │               │ APPROVED │
         └─────────┘               └──────────┘
              │                         ▲
    ┌─────────┴──────────┐              │
    │                    │    Jefe aprueba (individual
    ▼                    ▼    o masivo)
┌──────────┐      ┌──────────┐          │
│ APPROVED │      │ REJECTED │◄─────────┘ Jefe rechaza (con razón)
└──────────┘      └──────────┘
    │
    │ Contabilidad procesa pago
    ▼
┌───────────┐
│ PROCESSED │
└───────────┘
```

#### 1.3.2 Diagrama de flujo — Proceso de Clock-in/Clock-out en Quiosco

```
   Estudiante ingresa carnet + contraseña
                  │
                  ▼
      ¿Carnet ya en sesiones activas?
         (comparación case-insensitive)
                  │
        ┌─────────┴─────────┐
        │ SÍ                │ NO
        ▼                   ▼
   CLOCK-OUT          CLOCK-IN
        │                   │
        ▼                   ▼
Backend verifica       Backend verifica
  credenciales           credenciales
        │                   │
        ▼                   ▼
¿Credenciales OK?     ¿Credenciales OK?
        │                   │
     NO │ YES            NO │ YES
        ▼   │               ▼  │
   Error    │           Error   │
   401       ▼                  ▼
        ¿Departamento     ¿Quiosco activo
         correcto?         en su depto?
              │                 │
          NO  │ YES          NO │ YES
              ▼  │              ▼  │
          Error  │          Error   │
          403    ▼                  ▼
             Insertar          ¿Ya tiene
             WorkLog           sesión activa?
             PENDING               │
                │              NO  │ YES
             Eliminar              ▼  │
             sesión            Crear    │
                │              sesión  Error
             Refrescar         Kiosk   409
             estado            │
                               Refrescar
                               estado
```

#### 1.3.3 Diagrama de secuencia — Aprobación optimista de registro

```
Jefe       Frontend          API Backend        Supabase DB
  │              │                  │                  │
  │ Click aprobar│                  │                  │
  │─────────────►│                  │                  │
  │              │ Actualiza estado │                  │
  │              │ local (optimista)│                  │
  │              │ PENDING→APPROVED │                  │
  │              │                  │                  │
  │              │── PATCH /work-logs/{id}/status ────►│
  │              │                  │                  │
  │              │                  │── UPDATE DB ────►│
  │              │                  │◄── OK / Error ───│
  │              │◄── 200 updated / 4xx error ─────────│
  │              │                  │                  │
  │              │ [Si éxito]       │                  │
  │              │ Sincroniza con   │                  │
  │              │ respuesta server │                  │
  │              │                  │                  │
  │              │ [Si error]       │                  │
  │              │ Revierte a estado│                  │
  │              │ anterior (rollback│                 │
  │              │ optimista)       │                  │
  │◄─ Toast OK o │                  │                  │
  │   Toast Error│                  │                  │
```

#### 1.3.4 Diagrama de flujo — Cálculo de nómina

```
   Período seleccionado (ciclo o cuatrimestre)
                  │
                  ▼
   Obtener todos los work logs del período
   con status IN (APPROVED, PROCESSED)
                  │
                  ▼
   Para cada estudiante con registros:
   ┌─────────────────────────────────────────┐
   │  totalHoras   = Σ(log.hours)            │
   │  bruto        = totalHoras × tarifa     │
   │  diezmo       = bruto × 0.10            │
   │  neto         = bruto − diezmo          │
   │                                         │
   │  cobros       = Σ(receivables.amount)   │
   │   (para ese estudiante y ese período)   │
   │                                         │
   │  totalPagar   = max(0, neto − cobros)   │
   └─────────────────────────────────────────┘
                  │
                  ▼
   Ordenar por nombre de estudiante
                  │
                  ▼
   Retornar tabla de nómina con totales
```

---

## 2. Identificación de Patrones de Análisis

### 2.1 Patrón: Party / Role (Wiegers)

**Contexto:** El sistema gestiona múltiples tipos de usuario (Estudiante, Jefe, Admin, Super Admin, Contabilidad) que comparten atributos base (id, nombre, estado activo) pero difieren en sus capacidades.

**Aplicación en SENDA:** Se modeló una entidad única `User` con un atributo `role : UserRole` (enum) en lugar de crear una tabla por rol. Los permisos se validan en la capa de servicio del backend mediante comprobaciones explícitas del campo `role`. Esto simplifica la autenticación (un solo mecanismo JWT) y reduce la complejidad del esquema de base de datos.

**Justificación:** Los roles en UNADECA son estables y conocidos desde el inicio del proyecto. La herencia de tablas habría añadido complejidad sin beneficio práctico dado que los atributos diferenciadores son pocos (carnet para STUDENT, employeeNumber para DEPT_HEAD).

---

### 2.2 Patrón: Quantity / Measurement

**Contexto:** Las horas trabajadas, las tarifas horarias y los montos monetarios son cantidades con unidades específicas (horas, colones costarricenses).

**Aplicación en SENDA:**
- `WorkLog.hours`: almacenado como `number` (float, dos decimales). El cálculo `parseFloat(duration.toFixed(2))` garantiza consistencia.
- `HourlyRate.rate`: tarifa en colones (número entero para simplificar; no se trabaja con centavos en este dominio).
- Constante `TITHE_PERCENTAGE = 0.10` compartida entre frontend y backend (archivos separados, mismo valor).

**Justificación:** Al no existir decimales de colón en este dominio, el almacenamiento como número entero evita errores de punto flotante en los montos monetarios.

---

### 2.3 Patrón: Accounting / Ledger (adaptado)

**Contexto:** El módulo de contabilidad requiere gestionar entradas de nómina, descuentos y balances por período.

**Aplicación en SENDA:**
- Los `WorkLog` actúan como líneas de libro mayor (cada registro es una entrada de valor).
- La entidad `Receivable` (cuenta por cobrar) actúa como contrapartida que reduce el monto pagable.
- El reporte de nómina agrega estas entidades en un resumen por período.
- El estado `PROCESSED` marca los registros incluidos en una nómina pagada.

**Justificación:** Esta separación (registros de horas independientes de los descuentos) permite flexibilidad: una cuenta por cobrar puede ajustarse sin alterar los registros de horas originales.

---

### 2.4 Patrón: Observer / Realtime Sync

**Contexto:** El quiosco y los portales de jefe y admin necesitan ver datos actualizados sin recargar la página.

**Aplicación en SENDA:** Se usa Supabase Realtime (basado en PostgreSQL LISTEN/NOTIFY) para suscribirse a cambios en las tablas `work_logs`, `kiosk_sessions` y `kiosk_state`. Cuando ocurre un cambio, el hook correspondiente (`useWorkLogs`, `useKiosk`) programa un refetch con debounce de 250 ms.

**Justificación:** Polling activo cada N segundos habría sido más simple de implementar pero menos eficiente. El patrón Observer con Realtime desacopla el productor de datos (backend/quiosco) del consumidor (portal del jefe), reduciendo latencia y carga de red.

---

### 2.5 Patrón: State Machine

**Contexto:** Los work logs tienen un ciclo de vida bien definido con transiciones válidas restringidas.

**Aplicación en SENDA:**

```
Estados: PENDING → APPROVED → PROCESSED
                → REJECTED (estado terminal)
```

Las transiciones están controladas en la capa de servicio del backend:
- Solo un DEPT_HEAD del departamento correspondiente puede pasar PENDING → APPROVED/REJECTED.
- Solo ACCOUNTING puede pasar APPROVED → PROCESSED.
- No se pueden revertir transiciones (APPROVED no puede volver a PENDING).

**Justificación:** Modelar el flujo como máquina de estados formal previene transiciones inválidas y facilita las auditorías, ya que cada transición es trazable (quién, cuándo, razón).

---

## 3. Modelo de Datos Inicial

### 3.1 Entidades y Relaciones (ERD)

```
┌────────────────────────────────────────────────────────────────────────┐
│  profiles (extiende auth.users de Supabase)                            │
├────────────────────────────────────────────────────────────────────────┤
│ PK id              : UUID                                              │
│    name            : TEXT NOT NULL                                     │
│    role            : TEXT NOT NULL (CHECK IN valid_roles)              │
│    carnet          : TEXT UNIQUE (nullable, requerido para STUDENT)    │
│    employee_number : TEXT UNIQUE (nullable, requerido para DEPT_HEAD)  │
│    institutional_email: TEXT (nullable)                                │
│ FK department_id   : UUID → departments.id (nullable)                 │
│    is_active       : BOOLEAN DEFAULT TRUE                              │
│    created_at      : TIMESTAMPTZ DEFAULT now()                         │
└────────────────────────────────────────────────────────────────────────┘
                │
                │ M:1
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│  departments                                                            │
├────────────────────────────────────────────────────────────────────────┤
│ PK id          : UUID DEFAULT gen_random_uuid()                        │
│    name        : TEXT NOT NULL UNIQUE                                  │
│ FK head_id     : UUID → profiles.id (nullable)                         │
│    cost_center : TEXT NOT NULL                                         │
└────────────────────────────────────────────────────────────────────────┘
                │
                │ 1:M
                ▼
┌────────────────────────────────────────────────────────────────────────┐
│  work_logs                                                              │
├────────────────────────────────────────────────────────────────────────┤
│ PK id              : UUID DEFAULT gen_random_uuid()                    │
│ FK student_id      : UUID → profiles.id NOT NULL                      │
│ FK department_id   : UUID → departments.id NOT NULL                   │
│    date            : DATE NOT NULL                                     │
│    hours           : NUMERIC(5,2) NOT NULL CHECK (hours > 0)          │
│    description     : TEXT NOT NULL (máx. 200 chars)                   │
│    status          : TEXT NOT NULL DEFAULT 'PENDING'                  │
│      (CHECK IN: PENDING, APPROVED, PROCESSED, REJECTED)               │
│    entry_source    : TEXT DEFAULT 'MANUAL' (MANUAL | KIOSK)           │
│    start_time      : TIMESTAMPTZ (nullable)                            │
│    end_time        : TIMESTAMPTZ (nullable)                            │
│ FK approved_by     : UUID → profiles.id (nullable)                    │
│    approved_at     : TIMESTAMPTZ (nullable)                            │
│ FK rejected_by     : UUID → profiles.id (nullable)                    │
│    rejected_at     : TIMESTAMPTZ (nullable)                            │
│    rejection_reason: TEXT (nullable, máx. 150 chars)                  │
│    created_at      : TIMESTAMPTZ DEFAULT now()                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  rates (tarifas horarias)                                              │
├────────────────────────────────────────────────────────────────────────┤
│ PK id             : UUID DEFAULT gen_random_uuid()                     │
│    rate           : NUMERIC(10,2) NOT NULL                             │
│    effective_date : DATE NOT NULL DEFAULT CURRENT_DATE                 │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  kiosk_state                                                            │
├────────────────────────────────────────────────────────────────────────┤
│ PK id             : UUID DEFAULT gen_random_uuid()                     │
│ FK department_id  : UUID → departments.id UNIQUE NOT NULL             │
│ FK activated_by   : UUID → profiles.id NOT NULL                       │
│    activated_at   : TIMESTAMPTZ NOT NULL                               │
│    shifts         : JSONB DEFAULT '[]'                                 │
│      [{startTime: "HH:MM", endTime: "HH:MM"}]                         │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  kiosk_sessions                                                         │
├────────────────────────────────────────────────────────────────────────┤
│ PK id         : UUID DEFAULT gen_random_uuid()                         │
│ FK kiosk_id   : UUID → kiosk_state.id ON DELETE CASCADE NOT NULL      │
│ FK student_id : UUID → profiles.id UNIQUE NOT NULL                    │
│    started_at : TIMESTAMPTZ DEFAULT now()                              │
└────────────────────────────────────────────────────────────────────────┘
  *(ON DELETE CASCADE garantiza que al eliminar kiosk_state, las         │
    sesiones se eliminan automáticamente)*                               │

┌────────────────────────────────────────────────────────────────────────┐
│  accounting_config (registro único)                                    │
├────────────────────────────────────────────────────────────────────────┤
│ PK id                : UUID                                            │
│    becas_account     : TEXT                                            │
│    becas_name        : TEXT                                            │
│    diezmo_account    : TEXT                                            │
│    diezmo_name       : TEXT                                            │
│    payable_account   : TEXT                                            │
│    payable_name      : TEXT                                            │
│    receivable_account: TEXT                                            │
│    receivable_name   : TEXT                                            │
│    closing_day       : INTEGER DEFAULT 25 CHECK (1 ≤ closing_day ≤ 28)│
│    updated_at        : TIMESTAMPTZ                                     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  receivables (cuentas por cobrar)                                      │
├────────────────────────────────────────────────────────────────────────┤
│ PK id          : UUID                                                  │
│ FK student_id  : UUID → profiles.id NOT NULL                          │
│    period_key  : TEXT NOT NULL  ('cycle_YYYY-MM' | 'qN_YYYY')         │
│    amount      : NUMERIC(10,2) NOT NULL                                │
│    UNIQUE(student_id, period_key)                                      │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Reglas de Negocio en el Modelo de Datos

| Regla | Implementación |
|---|---|
| Un quiosco activo por departamento | `UNIQUE(department_id)` en `kiosk_state` |
| Un estudiante no puede tener dos sesiones activas | `UNIQUE(student_id)` en `kiosk_sessions` |
| Las horas deben ser positivas | `CHECK(hours > 0)` en `work_logs` |
| El día de cierre es un entero entre 1 y 28 | `CHECK(1 ≤ closing_day ≤ 28)` en `accounting_config` |
| Solo un monto por cobrar por estudiante por período | `UNIQUE(student_id, period_key)` en `receivables` |
| Al eliminar un quiosco, sus sesiones desaparecen | `ON DELETE CASCADE` en `kiosk_sessions.kiosk_id` |
| Los roles válidos están restringidos | `CHECK(role IN (valores))` en `profiles` |

### 3.3 Índices Recomendados

| Tabla | Columna(s) | Tipo | Justificación |
|---|---|---|---|
| `work_logs` | `student_id` | BTREE | Filtrar registros por estudiante |
| `work_logs` | `department_id` | BTREE | Filtrar por departamento |
| `work_logs` | `status` | BTREE | Filtrar por estado (PENDING, etc.) |
| `work_logs` | `date` | BTREE | Filtrar por rango de fechas (ciclo) |
| `profiles` | `department_id` | BTREE | Encontrar usuarios de un departamento |
| `profiles` | `role` | BTREE | Filtrar por rol |
| `kiosk_sessions` | `kiosk_id` | BTREE | Obtener sesiones de un quiosco |
| `receivables` | `(student_id, period_key)` | UNIQUE | Upsert por estudiante y período |

---

### Referencias Bibliográficas (APA)

Fowler, M. (2003). *Patterns of Enterprise Application Architecture*. Addison-Wesley Professional.

Rumbaugh, J., Jacobson, I., & Booch, G. (2005). *The Unified Modeling Language Reference Manual* (2nd ed.). Addison-Wesley Professional.

Wiegers, K., & Beatty, J. (2013). *Software Requirements* (3rd ed.). Microsoft Press.
