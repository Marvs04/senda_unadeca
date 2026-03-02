<div align="center">

# SENDA — Sistema de Horas Beca
### UNADECA · Universidad Adventista de Centroamérica

**A role-based portal for managing student work-scholarship hours — from clock-in to payroll.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Supabase Ready](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-32%20passing-22c55e?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## What is SENDA?

SENDA (*Sistema Estratégico de Normalización y Desarrollo Académico*) is UNADECA's internal platform for the *Horas Beca* program — a work-scholarship where students earn per logged and approved hour.

The system replaces spreadsheets and manual processes with a structured digital workflow:

1. **Students** log their hours through a portal or a kiosk check-in system
2. **Department Heads** review, approve or reject those logs
3. **Admins** manage the user roster, departments and the global hourly rate
4. **Accounting** consolidates approved hours into payroll reports and exports branded PDF documents
5. **Super Admins** oversee all accounts across the institution

Each role gets its own dedicated portal — same app, different views and permissions.

---

## Roles & Features

### 🎓 Student
- View total hours and estimated earnings for the current billing cycle
- Manual hour logging with description and date
- Real-time kiosk clock-in / clock-out (managed by department heads)
- Full history filterable by billing cycle, trimester and year
- Download personal report as PDF (institutional letterhead) or CSV

### 🏢 Department Head
- Dashboard with pending, approved and rejected log counts for the cycle
- Approve or reject individual logs, with mandatory written reason on rejection
- Bulk-approve all pending logs in one click
- Log hours directly on behalf of students (auto-approved)
- Activate / deactivate the kiosk for their department
- Export department report as PDF or CSV

### ⚙️ Admin
- Full user management — create, edit and suspend students, dept heads and accounting users
- Department management — assign and reassign department heads
- Update the global hourly rate (password-protected action)
- Dashboard with total hours, active students and global payroll estimate for the current cycle
- Export general report across all departments as PDF or CSV

### 💰 Accounting
- Consolidated payroll view by billing cycle or trimester
- Per-student breakdown: total hours, gross amount, 10% tithe deduction and net pay
- Filter by department and search by student name
- Process payments in bulk (marks approved logs as Processed)
- Export payroll as PDF with institutional letterhead and multi-page support

### 🛡️ Super Admin
- Create and manage all institutional accounts (Admins, Dept Heads, Accounting users)
- View and assist individual students across all departments

---

## Tech Stack

| Layer | Tool | Notes |
|---|---|---|
| UI Framework | React 19 | `React.lazy` code-splitting per portal |
| Language | TypeScript 5.8 | Strict mode — `tsc --noEmit` on every commit |
| Build | Vite 6 | esbuild under the hood, chunked output |
| Styling | Tailwind CSS 4 | Semantic design tokens via `@theme { --color-* }` |
| Animation | Motion 12 | Page transitions and modal animations |
| Charts | Recharts 3 | Payroll and hours bar / pie charts |
| Notifications | Sonner 2 | Action and error toasts |
| PDF Export | jsPDF 4 + jspdf-autotable 5 | Letterhead, grid tables, dated page footers |
| Icons | Lucide React | Consistent icon set throughout the UI |
| Testing | Vitest 4 | 32 unit tests for billing cycle and payroll logic |
| Linting | ESLint + typescript-eslint | 0-warning policy enforced pre-commit |
| Git Hooks | Husky | Runs lint before every commit |

---

## Getting Started

```bash
git clone https://github.com/Marvs04/senda_unadeca.git
cd senda_unadeca
git checkout develop
npm install
npm run dev
```

App runs at `http://localhost:5173` — no backend or environment variables required.

---

## Demo Accounts

Use these on the login screen. Any password works in demo mode.

| Role | Login | Name | Department |
|---|---|---|---|
| Student | `20240101` | Marvin Moncada | U Virtual |
| Student | `20240202` | Santiago Zuniga | U Virtual |
| Student | `20240303` | Yefry Benitez | Maintenance |
| Dept Head | `EMP-001` | Ing. Edy Echenique | U Virtual |
| Dept Head | `EMP-002` | Bismark Tinoco | Maintenance |

For **Admin**, **Accounting** and **Super Admin** — click **"Activate Demo Mode"** at the bottom of the login screen (only visible in development).

---

## Project Structure

```
senda_unadeca/
├── api/                      # Supabase client + mock data layer
│   ├── __mocks__.ts          # All mock data (swap out when backend is live)
│   ├── supabaseClient.ts     # Supabase client + table mappers
│   └── apiClient.ts          # Centralized HTTP client
├── components/
│   ├── ui/                   # Atomic components (Button, Modal, Input, Select…)
│   ├── layout/               # PortalLayout shell + PageContainer
│   ├── ErrorBoundary.tsx     # Global error boundary with debug details
│   └── Header.tsx            # Sticky header — style driven by user role
├── hooks/                    # Data + UI hooks (one per feature)
├── lib/
│   ├── business.ts           # Billing cycle logic and pay calculations
│   ├── pdf.ts                # Letterhead PDF engine (shared by all roles)
│   ├── env.ts                # Env variable validation at startup
│   └── utils.ts              # formatCurrency, exportToCSV, helpers
├── screens/
│   ├── admin/                # Admin portal + dashboard, students, dept tabs
│   ├── accounting/           # Accounting portal + payroll table + charts
│   ├── depthead/             # Dept Head portal + log form + approval flow
│   ├── student/              # Student portal + timer + history + financials
│   ├── superadmin/           # Super Admin portal + account management
│   ├── kiosk/                # Kiosk check-in / check-out screen
│   └── LoginScreen.tsx
├── services/                 # Data-access layer — mock today, Supabase tomorrow
├── types.ts                  # All shared TypeScript types and enums
└── constants.ts              # App-wide constants
```

---

## Commands

```bash
npm run dev          # Dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build locally
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint — 0 warnings allowed
npm run lint:fix     # ESLint with auto-fix
npm run test         # Run 32 unit tests
npm run test:ui      # Vitest interactive UI
```

---

<div align="center">
  Built for <strong>UNADECA</strong>  2026
</div>
