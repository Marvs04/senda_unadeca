<div align="center">

# SENDA — Sistema de Horas Beca UNADECA

**Portal de gestión de horas beca multi-rol para trabajadores estudiantiles de UNADECA.**  
Registra horas, aprueba registros, procesa nóminas y genera reportes PDF — todo en un solo lugar.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase Ready](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-32%20passing-22c55e?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## Overview

SENDA es el portal digital para el programa de *Horas Beca* de UNADECA. Reemplaza el control manual con un flujo de trabajo digital por roles — desde que el estudiante registra horas hasta que contabilidad exporta la nómina en PDF.

La app incluye una capa completa de datos mock — cada rol funciona desde el primer día sin necesitar backend. La capa de backend está completamente diseñada y documentada, lista para conectar a Supabase cuando comience el despliegue.

---

## Roles

| Rol | Portal | Responsabilidades |
|---|---|---|
| **Estudiante** | StudentPortal | Registrar horas, ver historial, consultar ingresos |
| **Jefe de Depto.** | DeptHeadPortal | Aprobar/rechazar registros, exportar reporte de depto. |
| **Administrador** | AdminPortal | Gestionar usuarios, departamentos, tarifa por hora |
| **Contabilidad** | AccountingPortal | Ver nómina por ciclo, exportar PDF/CSV con membrete |
| **Super Admin** | SuperAdminPortal | Gestionar todas las cuentas institucionales |

---

## Tech Stack

### Core
| Tool | Versión | Propósito |
|---|---|---|
| [React](https://react.dev) | 19 | Framework UI con code-splitting (React.lazy) |
| [TypeScript](https://www.typescriptlang.org) | 5.8 | Tipado estricto en todo el codebase |
| [Vite](https://vitejs.dev) | 6 | Dev server y build tool (esbuild) |

### Estilos
| Tool | Versión | Propósito |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utilidades — tokens semánticos `@theme { --color-* }` |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | latest | Composición condicional de clases sin conflictos |

### Animación
| Tool | Versión | Propósito |
|---|---|---|
| [Motion](https://motion.dev) | 12 | Transiciones de página, animaciones de modales |

### Datos y Gráficas
| Tool | Versión | Propósito |
|---|---|---|
| [Recharts](https://recharts.org) | 3 | Gráficas de nómina y horas en el portal de Contabilidad |
| [date-fns](https://date-fns.org) | 4 | Formateo de fechas y lógica de ciclos de facturación |

### Notificaciones
| Tool | Versión | Propósito |
|---|---|---|
| [Sonner](https://sonner.emilkowal.ski) | 2 | Toasts de acción y error |

### Export PDF
| Tool | Versión | Propósito |
|---|---|---|
| [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | 4 / 5 | Reportes PDF con membrete institucional UNADECA/SENDA |

### Íconos
| Tool | Propósito |
|---|---|
| [Lucide React](https://lucide.dev) | Set de íconos consistente en toda la UI |

### Calidad de Código
| Tool | Propósito |
|---|---|
| [Vitest](https://vitest.dev) | 32 tests unitarios para `lib/business.ts` |
| [ESLint](https://eslint.org) + typescript-eslint | 0 warnings en baseline |
| [Husky](https://typicode.github.io/husky) | Pre-commit hook: `npm run lint` antes de cada commit |

### Backend (listo, aún no conectado)
| Tool | Propósito |
|---|---|
| [Supabase](https://supabase.com) | PostgreSQL, Auth, Row Level Security, Edge Functions |

---

## Estructura del Proyecto

```
senda_unadeca/
├── api/                      # Cliente HTTP + cliente Supabase + datos mock
│   ├── apiClient.ts          # Cliente centralizado con gestión de tokens
│   ├── supabaseClient.ts     # Cliente Supabase + mappers de tablas
│   ├── __mocks__.ts          # Datos mock (eliminar cuando Supabase esté activo)
│   └── index.ts              # Barrel export
├── components/
│   ├── ui/                   # Componentes atómicos (Button, Modal, Input, ...)
│   ├── layout/               # PageContainer y PortalLayout (shell por rol)
│   ├── ErrorBoundary.tsx     # Error boundary global con detalles de debug
│   ├── Header.tsx            # Header sticky con config por rol
│   └── WorkLogTable.tsx      # Tabla reutilizable de registros de horas
├── hooks/                    # Feature hooks (datos, estado UI, debounce)
├── lib/
│   ├── business.ts           # Ciclos de facturación, cálculos de pago
│   ├── pdf.ts                # Motor de PDF con membrete profesional UNADECA
│   ├── env.ts                # Validación de variables de entorno al inicio
│   ├── utils.ts              # Exportar CSV, formatCurrency, helpers
│   ├── uiConfig.ts           # Colores de estado, mapas de etiquetas por rol
│   └── __tests__/
│       └── business.test.ts  # 32 tests unitarios
├── screens/
│   ├── admin/                # Portal Admin + tabs (Dashboard, Estudiantes, ...)
│   ├── accounting/           # Portal Contabilidad + gráficas + tabla nómina
│   ├── depthead/             # Portal Jefe Depto + formulario + modales
│   ├── student/              # Portal Estudiante + timer + historial + finanzas
│   ├── superadmin/           # Portal Super Admin + gestión de cuentas
│   ├── kiosk/                # Pantalla Kiosk (check-in/out de estudiantes)
│   └── LoginScreen.tsx
├── services/                 # Capa de acceso a datos (mock hoy → Supabase mañana)
├── types.ts                  # Todos los tipos y enums compartidos de TypeScript
└── constants.ts              # Constantes globales (TITHE_PERCENTAGE, etc.)
```

---

## Comandos

```bash
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Build de producción
npm run preview      # Preview del build de producción
npm run typecheck    # Verificación de tipos TypeScript (tsc --noEmit)
npm run lint         # ESLint con 0 warnings permitidos
npm run lint:fix     # ESLint con auto-fix
npm run test         # Vitest (32 tests, modo run)
npm run test:ui      # Vitest con UI interactiva
```

---

## Getting Started

### Requisitos
- Node.js 18+
- npm

### Instalar y ejecutar

```bash
git clone https://github.com/Marvs04/senda_unadeca.git
cd senda_unadeca
git checkout develop        # Rama de desarrollo activa
npm install
npm run dev
```

La app corre en `http://localhost:5173` con datos mock completos — no se necesita backend.

---

## PDFs con Membrete Institucional

Cada rol genera un PDF diferente al presionar "Descargar PDF":

| Portal | Contenido del PDF |
|---|---|
| Estudiante | Historial de horas — nombre, carnet, tasa por hora |
| Jefe de Depto. | Reporte de horas del departamento — jefe, ciclo |
| Contabilidad | Nómina de pagos — período, monto bruto, diezmo, neto |
| Admin | Reporte general — todos los departamentos del ciclo |

Todos los PDFs incluyen: encabezado **UNADECA / SENDA** con franja índigo, bloque de metadata, tabla con diseño grid y pie de página con fecha y número de página.

---

## Migración al Backend

El backend está completamente especificado en [`BACKEND_SPEC.md`](./BACKEND_SPEC.md). Al conectar:

1. Crear proyecto en Supabase y configurar variables de entorno:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
2. Ejecutar el SQL del esquema (tablas, políticas RLS, triggers, Edge Functions)
3. En cada `services/*.ts` — descomentar el bloque Supabase, eliminar el return mock
4. Eliminar `api/__mocks__.ts`

Todo lo demás permanece igual. Ver `BACKEND_SPEC.md §11` para el checklist completo de integración.

---

## Branch Strategy

| Branch | Propósito |
|---|---|
| `main` | Código estable y aprobado — solo recibe merges desde `develop` |
| `develop` | **Rama activa de desarrollo** — aquí se trabaja día a día |
| `features` | Cambios post-producción — hotfixes y nuevas funcionalidades en producción |

### Flujo de trabajo

```
develop  ──── (trabajo diario) ────▶  PR a main  ──▶  main (producción)
                                                          │
features  ◀──────────────────── (hotfixes / cambios en prod) ──────────┘
```

---

<div align="center">
  Desarrollado para <strong>UNADECA</strong> · 2026
</div>


---

## Overview

SENDA is a full frontend portal system built for UNADECA's student work-scholarship program (*Horas Beca*). It replaces manual tracking with a role-based digital workflow — from a student logging hours to accounting exporting payroll reports.

The app ships with a complete mock data layer so every role works out of the box today. The backend layer is fully designed and documented, ready to connect to Supabase when deployment begins.

---

## Roles

| Role | Portal | Responsibilities |
|---|---|---|
| **Student** | StudentPortal | Log hours, view history, track earnings |
| **Department Head** | DeptHeadPortal | Approve / reject logs, export dept reports |
| **Admin** | AdminPortal | Manage users, departments, set hourly rate |
| **Accounting** | AccountingPortal | View payroll by cycle, export PDF/CSV |
| **Super Admin** | SuperAdminPortal | Manage all accounts, reset passwords |

---

## Tech Stack

### Core
| Tool | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 19 | UI framework |
| [TypeScript](https://www.typescriptlang.org) | 5.8 | Type safety across the entire codebase |
| [Vite](https://vitejs.dev) | 6 | Dev server and build tool |

### Styling
| Tool | Version | Purpose |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | 4 | Utility-first styling |
| [clsx](https://github.com/lukeed/clsx) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) | latest | Conditional class composition without conflicts |

### Animation
| Tool | Version | Purpose |
|---|---|---|
| [Motion](https://motion.dev) (Framer Motion) | 12 | Page transitions, modal animations |

### Data & Charts
| Tool | Version | Purpose |
|---|---|---|
| [Recharts](https://recharts.org) | 3 | Payroll and hours charts in Accounting portal |
| [date-fns](https://date-fns.org) | 4 | Date formatting and billing cycle logic |

### Notifications
| Tool | Version | Purpose |
|---|---|---|
| [Sonner](https://sonner.emilkowal.ski) | 2 | Toast notifications |

### Export
| Tool | Version | Purpose |
|---|---|---|
| [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | 4 / 5 | PDF export for payroll and department reports |

### Icons
| Tool | Purpose |
|---|---|
| [Lucide React](https://lucide.dev) | Consistent icon set throughout the UI |

### Backend (ready, not yet connected)
| Tool | Purpose |
|---|---|
| [Supabase](https://supabase.com) | PostgreSQL database, Auth, Row Level Security, Edge Functions |

---

## Project Structure

```
senda_unadeca/
├── api/                    # HTTP client + Supabase client + mock data
│   ├── apiClient.ts        # Centralized HTTP client with token management
│   ├── supabaseClient.ts   # Supabase client + table mappers
│   ├── __mocks__.ts        # Mock data (replace when Supabase is live)
│   └── index.ts            # Barrel export
├── components/
│   ├── ui/                 # Atomic UI components (Button, Modal, Input, ...)
│   └── layout/             # Page containers and portal layout shell
├── hooks/                  # Feature hooks (data fetching, UI state)
├── lib/
│   ├── business.ts         # Billing cycle, pay calculations
│   ├── utils.ts            # CSV/PDF export, helpers
│   └── uiConfig.ts         # Status colors, label maps
├── screens/
│   ├── admin/              # Admin portal + tab components
│   ├── accounting/         # Accounting portal + charts + payroll table
│   ├── depthead/           # Department Head portal + log form + modals
│   ├── student/            # Student portal + timer + history + financials
│   ├── superadmin/         # Super Admin portal + account management
│   └── LoginScreen.tsx
├── services/               # Data-access layer (mock today → Supabase tomorrow)
├── types.ts                # All shared TypeScript types and enums
└── constants.ts            # App-wide constants
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/Marvs04/senda_unadeca.git
cd senda_unadeca
npm install
npm run dev
```

The app runs at `http://localhost:5173` with full mock data — no backend needed.

### Build

```bash
npm run build
```

### Type Check

```bash
npm run lint
```

---

## Backend Migration

The backend is fully specced in [`BACKEND_SPEC.md`](./BACKEND_SPEC.md). When ready:

1. Create a Supabase project and set environment variables:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
2. Run the schema SQL from the spec (tables, RLS policies, triggers, Edge Functions)
3. In each `services/*.ts` file — uncomment the Supabase block, delete the mock return
4. Delete `api/__mocks__.ts`

Everything else stays the same.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `dev` | Integration branch for active development |
| `feature/*` | Individual feature branches |

---

<div align="center">
  Built for <strong>UNADECA</strong> · 2026
</div>
