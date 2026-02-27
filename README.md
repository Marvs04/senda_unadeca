<div align="center">

# SENDA — Sistema de Horas Beca UNADECA

**Multi-role work-hours management portal for UNADECA student workers.**  
Track hours, approve logs, run payroll reports — all in one place.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase Ready](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat-square&logo=supabase&logoColor=white)

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
