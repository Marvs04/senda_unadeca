<div align="center">

# SENDA  Sistema de Horas Beca UNADECA

**Multi-role work-hours management portal for UNADECA student workers.**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-32%20passing-22c55e?style=flat-square&logo=vitest&logoColor=white)

</div>

---

## Getting Started

```bash
git clone https://github.com/Marvs04/senda_unadeca.git
cd senda_unadeca
git checkout develop
npm install
npm run dev
```

App runs at `http://localhost:5173`  no backend required.

---

## Demo Accounts

Use these credentials on the login screen. The password field is not validated in demo mode.

| Role | Login (Carnet / Employee #) | Name |
|---|---|---|
| Student | `20240101` | Marvin Moncada |
| Student | `20240202` | Santiago Zuniga |
| Student | `20240303` | Yefry Benitez |
| Dept Head | `EMP-001` | Ing. Edy Echenique |
| Dept Head | `EMP-002` | Bismark Tinoco |

For **Admin**, **Accounting** and **Super Admin**  use the **"Activate Demo Mode"** button on the login screen (only visible in development).

---

## Roles

| Role | What they can do |
|---|---|
| **Student** | Log hours, view history, track earnings |
| **Dept Head** | Approve / reject logs, register hours, export reports |
| **Admin** | Manage users, departments and hourly rate |
| **Accounting** | Process payroll by cycle, export branded PDF / CSV |
| **Super Admin** | Manage all institutional accounts |

---

## Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint (0 warnings)
npm run test         # 32 unit tests
```

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable production code |
| `develop` | Active development  work here day to day |
| `features` | Post-production hotfixes and new features |

---

<div align="center">
  Built for <strong>UNADECA</strong>  2026
</div>
