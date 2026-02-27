# FASE 1 — Design System Audit & Documentación

**Proyecto:** UNADECA – Portal de Horas Beca  
**Stack CSS:** Tailwind CSS v4 (via `@tailwindcss/vite`) + CSS custom properties en `index.css`  
**Estado fuentes:** Declaradas en `--font-*` variables pero NO cargadas desde CDN externo → se recomienda añadir Google Fonts link en `index.html` para `Inter`, `Outfit` y `JetBrains Mono`.

---

## A) DESIGN SYSTEM GLOBAL

### A.1 — Paleta de Colores

Todos los colores se extraen del uso real en el código. El proyecto usa la escala default de Tailwind (zinc, indigo, emerald, rose, amber, slate) y dos tokens institucionales propios.

#### Tokens personalizados (definidos en `index.css`)
| Token | Valor HEX | Uso |
|---|---|---|
| `--color-unadeca-blue` | `#003366` | Branding institucional (headStyles PDF) |
| `--color-unadeca-gold` | `#FFD700` | Branding institucional |
| `--color-admin-primary` | `#18181b` | Zinc-900 alias para portales admin |
| `--color-admin-accent` | `#6366f1` | Indigo-500 alias |
| `--color-student-primary` | `#f8fafc` | Slate-50 fondo estudiante |
| `--color-student-accent` | `#10b981` | Emerald-500 |

#### Colores de Tailwind usados (valores reales)
| Role | Clase | HEX |
|---|---|---|
| Fondo global | `bg-zinc-50` | `#fafafa` |
| Fondo oscuro | `bg-zinc-950` | `#09090b` |
| Fondo card | `bg-white` | `#ffffff` |
| Texto principal | `text-zinc-900` | `#18181b` |
| Texto secundario | `text-zinc-500` | `#71717a` |
| Texto muted | `text-zinc-400` | `#a1a1aa` |
| Border default | `border-zinc-100` | `#f4f4f5` |
| Border medium | `border-zinc-200` | `#e4e4e7` |
| Hover surface | `bg-zinc-50` / `bg-zinc-100` | `#fafafa` / `#f4f4f5` |
| CTA primario | `bg-zinc-900` | `#18181b` |
| CTA hover | `bg-zinc-800` | `#27272a` |
| Indigo accent | `bg-indigo-50` | `#eef2ff` |
| Indigo text | `text-indigo-600` | `#4f46e5` |
| Indigo badge | `bg-indigo-500/10` | rgba(99,102,241,0.1) |
| Emerald success | `bg-emerald-500` | `#10b981` |
| Emerald soft | `bg-emerald-50` | `#ecfdf5` |
| Emerald text | `text-emerald-600` | `#059669` |
| Amber warning | `bg-amber-500/10` | rgba(245,158,11,0.1) |
| Amber text | `text-amber-600` | `#d97706` |
| Rose error | `bg-rose-50` | `#fff1f2` |
| Rose text | `text-rose-600` | `#e11d48` |
| Rose soft border | `border-rose-100` | `#ffe4e6` |
| Slate dark bg | `bg-slate-950` | `#020617` |
| DeptHead student bg | `#f8f9fa` | custom inline |

#### Colores de texto con opacidad (usados frecuentemente)
```
text-white/50  → rgba(255,255,255,0.5)
text-white/70  → rgba(255,255,255,0.7)
text-zinc-400  → #a1a1aa
bg-white/5     → rgba(255,255,255,0.05)
bg-white/10    → rgba(255,255,255,0.10)
border-white/10 → rgba(255,255,255,0.10)
border-white/20 → rgba(255,255,255,0.20)
```

---

### A.2 — Tipografía

#### Familias declaradas en `index.css`
```css
--font-sans:    "Inter", ui-sans-serif, system-ui, sans-serif;
--font-display: "Outfit", sans-serif;
--font-mono:    "JetBrains Mono", monospace;
```

> ⚠️ Actualmente NO hay `<link>` a Google Fonts en `index.html`. Para producción agregar:
> ```html
> <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
> ```

#### Escala tipográfica usada (Tailwind classes)
| Clase | rem / px aprox | Uso |
|---|---|---|
| `text-[9px]` | 9px | Razón de rechazo muted |
| `text-[10px]` | 10px | Labels uppercase, badges, tracking widest |
| `text-xs` | 12px | Subtítulos, acciones, tooltips |
| `text-sm` | 14px | Cuerpo principal de tablas y forms |
| `text-base` | 16px | Header brand name |
| `text-lg` | 18px | Section headers |
| `text-xl` | 20px | Modal titles |
| `text-2xl` | 24px | Card values compactos |
| `text-3xl` | 30px | Page titles |
| `text-4xl` | 36px | Student name hero |
| `text-8xl` | 96px | Timer cronómetro |

#### Font weights usados
| Clase | Peso | Uso |
|---|---|---|
| `font-medium` | 500 | Cuerpo de tablas |
| `font-semibold` | 600 | Nombre en header |
| `font-bold` | 700 | Labels, valores |
| `font-black` | 900 | Hero values, timer, tracking-widest labels |

#### Letter spacing
| Clase | Valor | Uso |
|---|---|---|
| `tracking-tight` | -0.025em | Títulos display |
| `tracking-wider` | 0.05em | Roles en header |
| `tracking-widest` | 0.1em | Labels uppercase 10px |
| `tracking-[0.2em]` | 0.2em | Role texto portal header |
| `tracking-[0.3em]` | 0.3em | Timer status label |
| `tracking-tighter` | -0.05em | Timer display |

#### Font families por clase
```
font-display → Outfit (headings, valores grandes)
font-mono    → JetBrains Mono (timer, montos, carnets, employee numbers)
default      → Inter (todo el resto)
```

---

### A.3 — Espaciado (Padding / Margin Scale usada)

Tailwind spacing scale usada activamente (no exhaustiva, solo lo que aparece en código):

| Valor | px | Usos frecuentes |
|---|---|---|
| `0.5` | 2px | Padding badge status |
| `1` | 4px | Gap icons |
| `1.5` | 6px | Padding tabs internas |
| `2` | 8px | Padding icon containers |
| `2.5` | 10px | Botones secundarios |
| `3` | 12px | Icon container padding |
| `3.5` | 14px | Input py |
| `4` | 16px | Table cell padding, gaps comunes |
| `5` | 20px | Button px |
| `6` | 24px | DashboardCard padding, table px |
| `7` | 28px | — |
| `8` | 32px | Card padding principal |
| `9` | — | — |
| `10` | 40px | Page main `py-10` |
| `12` | 48px | Student profile section margin |
| `16` | 64px | — |

---

### A.4 — Border Radius Scale

| Clase | Valor | Componente |
|---|---|---|
| `rounded-lg` | 8px | Botones pequeños, badges role |
| `rounded-xl` | 12px | Inputs, botones secundarios |
| `rounded-2xl` | 16px | Modales interiores, tablas internas |
| `rounded-3xl` | 24px | Cards pequeñas, status badges |
| `rounded-[2rem]` | 32px | Sección pendientes DeptHead |
| `rounded-[2.5rem]` | 40px | Cards principales (Admin, Accounting) |
| `rounded-[3rem]` | 48px | History card StudentPortal |
| `rounded-[3.5rem]` | 56px | Timer card StudentPortal, Profile hero |
| `rounded-full` | 9999px | Badge status, avatar placeholder |

---

### A.5 — Sombras

| Clase | Uso |
|---|---|
| `shadow-sm` | Cards normales con fondo blanco |
| `shadow-xl` | Cards hover, botones CTA |
| `shadow-2xl` | Timer card, modales |
| `shadow-xl shadow-zinc-200/50` | Student history card |
| `shadow-xl shadow-zinc-900/10` | Submit buttons oscuros |
| `shadow-xl shadow-zinc-900/20` | DashboardCard dark variant |
| `shadow-2xl shadow-zinc-950/40` | Timer panel negro |
| `shadow-lg shadow-emerald-600/10` | Approve buttons |
| `shadow-lg shadow-rose-600/20` | Reject confirm button |
| `shadow-[0_0_15px_rgba(52,211,153,0.6)]` | Timer dot indicador activo (glow) |

`.glass-card` custom:
```css
background: rgba(255,255,255,0.80);
backdrop-filter: blur(24px);
border: 1px solid rgba(228,228,231,0.50);
box-shadow: 0 20px 25px -5px rgb(228,228,231 / 0.40);
```

`.student-card` custom:
```css
background: #fff;
border: 1px solid #e4e4e7;
box-shadow: 0 20px 25px -5px rgb(228,228,231 / 0.50);
color: #18181b;
```

---

### A.6 — Transiciones

| Patrón | Clases |
|---|---|
| Default transition | `transition-all` (150ms ease) |
| Duración extendida | `transition-all duration-300` |
| Color only | `transition-colors` |
| Scale en active | `active:scale-95`, `active:scale-[0.97]` |
| Hover y: | `whileHover={{ y: -4 }}` (Motion) |
| Hover y: student cards | `whileHover={{ y: -5 }}` |
| Opacity | `transition-opacity` |

#### Motion (Framer/Motion) patterns usados:
```
initial={{ opacity: 0, y: 10 }}  animate={{ opacity: 1, y: 0 }}   // page sections
initial={{ opacity: 0, y: 20 }}  animate={{ opacity: 1, y: 0 }}   // profile hero
initial={{ opacity: 0, x: 20 }}  animate={{ opacity: 1, x: 0 }}   // portal transitions (App.tsx)
initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}   // portal exit
initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}  // modales
initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} // timer card
initial={{ opacity: 0, height: 0 }}  animate={{ opacity: 1, height: 'auto' }} // pendientes section
initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}   // Header
initial={{ opacity: 0, y: 10 }}  transition={{ delay: idx * 0.05 }} // table rows stagger
```

---

### A.7 — Breakpoints

| Clase | Breakpoint |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

Layout adaptivo más común:
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- `grid-cols-1 lg:grid-cols-12` con `col-span-8` + `col-span-4`
- `flex-col md:flex-row`
- `hidden md:flex`
- `sm:inline` para textos en botones

---

### A.8 — Z-index Scale

| Clase | Valor | Uso |
|---|---|---|
| `z-0` | 0 | Background gradients StudentPortal |
| `z-10` | 10 | Content sobre fondos |
| `z-50` | 50 | Modales, header sticky |
| `top-0 sticky` | — | Header position |

---

### A.9 — Tokens implícitos CSS (definidos en `index.css`)

```css
/* Clases utilitarias globales */
.glass-card        → bg-white/80 backdrop-blur-2xl border border-zinc-200/50 shadow-xl shadow-zinc-200/40
.student-card      → bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 text-zinc-900
.btn-primary       → px-4 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
.page-container    → max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12
.select-custom     → bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-4 text-xs font-bold focus:ring-0 appearance-none cursor-pointer hover:bg-zinc-100 transition-all
.custom-scrollbar  → scrollbar width 6px, transparent track, thumb sin configurar en snippet visto

/* Global body */
body: bg-zinc-50 text-zinc-900 antialiased selection:bg-indigo-100 selection:text-indigo-900
font-feature-settings: "cv02","cv03","cv04","cv11","tnum"
```

---

## B) DOCUMENTACIÓN POR PÁGINA

### B.1 — LoginScreen (`screens/LoginScreen.tsx`)

**Layout:** Centrado full-screen, un solo bloque card al centro con animación de entrada.

**Componentes:** Card login, selector de rol/usuario, button submit.

**Clases clave:**
- Fondo: `min-h-screen bg-zinc-50`
- Card: `bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm p-8`
- Logo/brand: `text-xl font-bold font-display tracking-tight`
- Input/Select: `.select-custom` → `bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-4 text-xs font-bold`
- Button: `bg-zinc-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-zinc-800 active:scale-95 transition-all`

---

### B.2 — Header (`components/Header.tsx`)

**Layout:** `sticky top-0 z-50` full-width, flex row, justify-between, h-16.

**Tema por rol:**
| Rol | bg | text | border |
|---|---|---|---|
| SUPER_ADMIN | `bg-zinc-950` | white | `border-zinc-800` |
| ADMIN | `bg-white` | zinc-900 | `border-zinc-200` |
| DEPT_HEAD | `bg-white` | zinc-900 | `border-zinc-200` |
| STUDENT | `bg-slate-950` | white | `border-white/10` |
| ACCOUNTING | `bg-white` | zinc-900 | `border-zinc-200` |

**Backdrop:** `backdrop-blur-md`

**Interacciones:**
- Bell button: `hover:bg-white/10` (dark) / `hover:bg-zinc-100` (light)
- Logout button dark: `bg-white/5 hover:bg-white/10 border-white/10`
- Logout button light: `bg-zinc-900 hover:bg-zinc-800 border-zinc-900 text-white`

---

### B.3 — SuperAdminPortal (`screens/SuperAdminPortal.tsx`)

**Layout:** `min-h-screen bg-zinc-50`, `page-container py-10`, grid `lg:grid-cols-12` → `col-span-8` + `col-span-4`

**Secciones:**
1. **Page header** – icon + title `text-3xl font-bold tracking-tight`, subtitle `text-zinc-500 text-sm`
2. **Admin List card** – `bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm` con tabla interior `rounded-2xl border border-zinc-100`
3. **Student Help card** – `bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm`, searchbar `rounded-2xl`, list con scroll `max-h-[300px] overflow-y-auto custom-scrollbar`
4. **Create Account form** – `bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm`
5. **Security notice** – `p-8 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-900`

**Role type selector:** Grid 2 cols de botones toggle  
- Active: `bg-zinc-900 border-zinc-900 text-white`  
- Inactive: `bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100`

**Reset password button:** `inline-flex items-center text-xs font-bold text-zinc-400 hover:text-zinc-900`

**Student item hover:** `border-zinc-50 → hover:border-zinc-200`, icon `bg-zinc-100 → group-hover:bg-zinc-900 group-hover:text-white`

---

### B.4 — AdminPortal (`screens/AdminPortal.tsx`)

**Layout:** `min-h-screen bg-zinc-50`, `page-container py-10`

**Navegación:** Tab bar `bg-zinc-100 p-1 rounded-2xl` con tabs activos `bg-white shadow-sm`

**Pestañas:** Dashboard, Estudiantes, Jefes Depto, Departamentos

**Transition entre tabs:** `AnimatePresence mode="wait"` con `opacity+y`

**Dashboard sub-layout:**
- KPI cards: `grid grid-cols-1 md:grid-cols-3 gap-6`
- Charts: `grid lg:grid-cols-12 gap-8` → col-span-8 BarChart + col-span-4 PieChart
- WorkLogTable: card `rounded-[2.5rem]`

**Charts (Recharts):**
- BarChart: `CartesianGrid` stroke `#f4f4f5`, top bar radius `[6,6,0,0]`, first bar fill `#18181b`, rest `#e4e4e7`
- PieChart: innerRadius 60, outerRadius 80, paddingAngle 5, colors `['#18181b','#6366f1','#10b981','#f59e0b','#ef4444']`
- Tooltip: `borderRadius:16px border:none, boxShadow: 0 10px 15px -3px rgb(0 0 0/0.1)`

**Modales:** `fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm`; card `bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl`

**Rate Update modal:** button submit `bg-emerald-600 hover:bg-emerald-700`

---

### B.5 — DeptHeadPortal (`screens/DeptHeadPortal.tsx`)

**Layout:** `min-h-screen bg-zinc-50 selection:bg-emerald-100`, `page-container py-10`

**Header section:** flex col→row, badge `bg-emerald-100 border-emerald-200` con texto `text-emerald-700`, date picker en card `bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm`

**KPI cards:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6` → `DashboardCard` light variant

**Pendientes section:** border `border-amber-100 shadow-amber-500/5`, icon bg `bg-amber-50`, "Aprobar todo" `bg-emerald-600 hover:bg-emerald-700`

**Historial section:** export buttons: CSV `bg-zinc-50 hover:bg-zinc-100`, PDF `bg-zinc-900 hover:bg-zinc-800`

**Register form (sticky col-span-4):** `sticky top-28`, select custom, date input, number input, textarea con char counter

**Rejection Modal:** `bg-rose-50 rounded-xl` icon container, confirm `bg-rose-600 hover:bg-rose-700`

---

### B.6 — StudentPortal (`screens/StudentPortal.tsx`)

**Layout:** `min-h-screen bg-[#f8f9fa] selection:bg-zinc-900 selection:text-white`, `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12`

**Profile Hero:** `relative` con `absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-[3.5rem] shadow-2xl shadow-zinc-900/20`; avatar `w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10`; status badge `bg-emerald-500/10 border-emerald-500/20 rounded-full text-emerald-400`; online dot `w-8 h-8 bg-emerald-500 rounded-xl border-4 border-zinc-900`

**Grid:** `lg:grid-cols-12` → col-span-7 (historial) + col-span-5 (timer + finanzas)

**History card:**
- View toggle: `bg-zinc-100 p-1.5 rounded-2xl` con botones activos `bg-white shadow-sm`
- Tab active: `text-zinc-900`, inactive: `text-zinc-400 hover:text-zinc-600`

**Timer panel:** `bg-zinc-950 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl shadow-zinc-950/40`
- Blur glows: `w-80 h-80 bg-emerald-500/10 blur-[120px]` (top-right) + `bg-indigo-500/10 blur-[120px]` (bottom-left)
- Timer display: `text-8xl font-black tracking-tighter font-mono tabular-nums`
- Status dot: `w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]`
- Start button: `bg-white text-zinc-950 font-black py-8 rounded-[2.5rem] hover:bg-zinc-100`
- Finish button: `bg-emerald-500 text-white font-black py-8 rounded-[2.5rem] hover:bg-emerald-400 shadow-xl shadow-emerald-500/20`
- Cancel: `text-white/40 hover:text-rose-400`

**Financial cards (2-col grid):**
- Net card: `bg-white p-8 rounded-[3rem]`, glow `bg-emerald-500/5 blur-2xl group-hover:bg-emerald-500/10`, icon bg `bg-emerald-50`
- Tithe card: `bg-white p-8 rounded-[3rem]`, glow `bg-amber-500/5`, icon bg `bg-amber-50`, value `text-amber-600`

**Next payment card:** `bg-zinc-900 text-white rounded-[3rem] min-h-[160px]`, icon `bg-white/10 rounded-2xl`

---

### B.7 — AccountingPortal (`screens/AccountingPortal.tsx`)

**Layout:** `min-h-screen bg-zinc-50 selection:bg-indigo-100`, `page-container py-10`

**Header toolbar:** searchbar + dept filter + view toggle + period selector + export buttons (flex-wrap gap-3)

**View toggle:** `bg-zinc-100 p-1 rounded-xl` con activo `bg-white text-zinc-900 shadow-sm`

**KPI cards:** `grid grid-cols-1 md:grid-cols-2 gap-6`

**Charts:** `lg:grid-cols-12` → BarChart col-span-8 + PieChart col-span-4

**Weekly summary:** lista `space-y-4` con items `bg-zinc-50 rounded-2xl p-4`

**Trimester progress:** grid 3 cols; activo `bg-zinc-900 text-white shadow-xl`; inactivo `bg-white border-zinc-100`

**Payroll table:** `rounded-2xl border border-zinc-100` dentro de card `rounded-[2.5rem]`

**Process button:** `bg-zinc-900 text-white rounded-2xl flex items-center space-x-3` con icono emerald

---

### B.8 — DashboardCard (`components/DashboardCard.tsx`)

Dos variantes:

**Light (default):**
```
bg-white border-zinc-100 text-zinc-900 shadow-sm
hover: shadow-xl hover:shadow-zinc-200/50
icon wrap: bg-zinc-100 text-zinc-600
label: text-[10px] uppercase tracking-widest text-zinc-400
value: text-3xl font-bold tracking-tight font-display
```

**Dark:**
```
bg-zinc-900 border-white/10 text-white shadow-2xl shadow-black/20
icon wrap: bg-white/10 text-white
label: text-white/50
```

**Animación:** `whileHover={{ y: -4 }}`

---

### B.9 — WorkLogTable (`components/WorkLogTable.tsx`)

**Contenedor:** `rounded-3xl border overflow-hidden transition-all duration-300`  
- Light: `bg-white border-zinc-100 text-zinc-900 shadow-sm`  
- Dark: `bg-zinc-900 border-white/10 text-white`

**Header row:** `text-[10px] uppercase tracking-widest font-bold opacity-40`  
- Light thead: `bg-zinc-50`  
- Dark thead: `bg-white/5`

**Row hover:**  
- Light: `hover:bg-zinc-50`  
- Dark: `hover:bg-white/5`

**StatusBadge:**
| Estado | Classes |
|---|---|
| PENDING | `bg-amber-500/10 text-amber-600 border-amber-500/20` |
| APPROVED | `bg-indigo-500/10 text-indigo-600 border-indigo-500/20` |
| PROCESSED | `bg-emerald-500/10 text-emerald-600 border-emerald-500/20` |
| REJECTED | `bg-rose-500/10 text-rose-600 border-rose-500/20` |

**Badge:** `px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border`

**Motion rows:** `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}`

**Empty state:** `text-sm opacity-40 font-medium italic`

---

## C) MAPEO CDN → CSS LOCAL

### C.1 — Situación actual

| Elemento | Método actual | Método recomendado |
|---|---|---|
| Tailwind | `@tailwindcss/vite` plugin (✅ local) | Mantener igual |
| Google Fonts | **Sin cargar** (variables declaradas pero no importadas) | Añadir a `index.html` o `index.css` via `@import` |
| Sonner (toasts) | npm package (✅ local) | Mantener igual |
| Motion/Framer | `motion` npm package (✅ local) | Mantener igual |
| Recharts | npm package (✅ local) | Mantener igual |

> No hay dependencia de CDNs externos activos, excepto que las tipografías probablemente estén cayendo a las fuentes del sistema. Se deben importar.

### C.2 — Clases custom a mantener en `index.css`

```css
/* /styles/global.css → actualmente en index.css */
@import "tailwindcss";

@theme {
  --font-sans:    "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Outfit", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;
  
  --color-unadeca-blue: #003366;
  --color-unadeca-gold: #FFD700;
  --color-admin-primary: #18181b;
  --color-admin-accent:  #6366f1;
  --color-student-primary: #f8fafc;
  --color-student-accent:  #10b981;
}

@layer base {
  body {
    @apply bg-zinc-50 text-zinc-900 antialiased selection:bg-indigo-100 selection:text-indigo-900;
    font-feature-settings: "cv02","cv03","cv04","cv11","tnum";
  }
}

@layer components {
  .glass-card    { @apply bg-white/80 backdrop-blur-2xl border border-zinc-200/50 shadow-xl shadow-zinc-200/40; }
  .student-card  { @apply bg-white border border-zinc-200 shadow-xl shadow-zinc-200/50 text-zinc-900; }
  .btn-primary   { @apply px-4 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none; }
  .page-container { @apply max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12; }
  .select-custom { @apply bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-4 text-xs font-bold focus:ring-0 appearance-none cursor-pointer hover:bg-zinc-100 transition-all; }
  .custom-scrollbar { /* scrollbar width 6px, transparent track */ }
}
```

### C.3 — Propuesta de estructura de estilos

```
/styles/
  global.css              ← @import "tailwindcss", body, tokens, @layer base
  tokens.css              ← todas las variables CSS (colores, tipografías, spacing)
  components/
    card.css              ← .glass-card, .student-card, DashboardCard, WorkLogTable
    button.css            ← .btn-primary, variantes por estado/color
    badge.css             ← StatusBadge, role badges 
    form.css              ← inputs, .select-custom, textarea, label
    modal.css             ← overlay, modal container, animations
    header.css            ← Header sticky con variantes por rol
    scrollbar.css         ← .custom-scrollbar
    table.css             ← tabla thead/tbody/tr/td styles reutilizables
  pages/
    login.css             ← LoginScreen específico
    super-admin.css       ← SuperAdminPortal específico
    admin.css             ← AdminPortal tabs, charts container
    dept-head.css         ← DeptHeadPortal, rejection modal
    student.css           ← timer glow, profile hero gradient, financial cards
    accounting.css        ← toolbar, weekly summary, trimester cards
```

---

## D) PLAN DE MIGRACIÓN SIN REGRESIONES

### D.1 — Orden de migración recomendado

```
1. Fix inmediato (no visual):
   → Añadir Google Fonts a index.html (Inter, Outfit, JetBrains Mono)
   → Verificar que las tipografías renderizan correctamente

2. tokens.css:
   → Extraer @theme variables a archivo separado
   → Importar en global.css

3. global.css:
   → Mantener @layer base (body)
   → Mover componentes globales (@layer components) a /styles/components/

4. Componentes shared (Header, DashboardCard, WorkLogTable):
   → Extraer a /styles/components/
   → Probar visualmente cada componente aislado

5. Por pantalla (de menos a más compleja):
   → LoginScreen   (menor riesgo)
   → SuperAdminPortal
   → DeptHeadPortal
   → AdminPortal   (más compleja: tabs + charts)
   → AccountingPortal
   → StudentPortal (más compleja: timer, gradients, glows)

6. Modal unificado:
   → Crear .modal-overlay y .modal-card una vez, heredado por todas las páginas
```

### D.2 — Estrategia para evitar romper diseño

- **Una pantalla a la vez.** No migrar múltiples pages simultáneamente.
- **Branch separado por pantalla.** Cada migración = PR revisable.
- **Snapshot visual antes/después.** Tomar screenshot de cada estado relevante de la pantalla antes de migrar.
- **No cambiar clases en JSX.** Solo crear CSS que mapee exactamente lo que ya producen las utilidades Tailwind actuales.
- **Usar `@apply` en Tailwind para migrar** classes repetidas en vez de reescribir valores CSS manuales.
- **Mantener Tailwind activo** durante toda la migración. Solo al final, si se quiere eliminar utilidades una a una.

### D.3 — Pruebas visuales recomendadas

Por cada pantalla migrada, verificar:
- [ ] Token de color: ningún color cambia entre variantes (usar DevTools color picker)
- [ ] Tipografía: pesos, tamaños y familias idénticos
- [ ] Responsive: sm / md / lg / xl breakpoints
- [ ] Hover states: todos los botones, filas de tabla, cards
- [ ] Active states: `active:scale-95`
- [ ] Modal open/close: opacity, scale, backdrop-blur
- [ ] Timer (StudentPortal): glow dot, font-mono display
- [ ] Dark sections: zinc-950 timer, zinc-900 cards, header dark
- [ ] AnimatePresence transitions: entrada/salida de páginas y secciones
- [ ] Recharts: colores de barras y pie slices
- [ ] StatusBadge: los 4 estados con colores correctos
- [ ] Toasts (Sonner): posición `top-right` / `top-center`, con `richColors`

---

## PENDIENTES CRÍTICOS (previo a migración)

| Prioridad | Tarea | Impacto |
|---|---|---|
| 🔴 CRÍTICO | Añadir Google Fonts a `index.html` (Inter, Outfit, JetBrains Mono) | Tipografías caen a sistema |
| 🔴 CRÍTICO | La contraseña `admin123` está hardcoded en `AdminPortal.tsx` | Seguridad |
| 🟡 MEDIO | Fuentes importadas desde CDN deben pasar a self-hosted en producción | Performance |
| 🟡 MEDIO | `DashboardCard` recibe prop `trend` que no existe en su interfaz actual | TypeScript error latente |
| 🟢 MEJORA | Extraer `roleConfig` de Header a `constants.ts` | Mantenibilidad |
| 🟢 MEJORA | Centralizar colores de StatusBadge en un único archivo de tokens | DRY |

---

*Documento generado: Fase 1 — Auditoría & Design System*  
*Rama: `marvs_development`*
