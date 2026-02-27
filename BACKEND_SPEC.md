# SENDA â€” Supabase Implementation Spec
**Sistema EstratÃ©gico de NormalizaciÃ³n y Desarrollo AcadÃ©mico**  
**InstituciÃ³n:** UNADECA  
**Frontend stack:** React + TypeScript + Vite + `@supabase/supabase-js`  
**Document purpose:** Complete reference to implement the Supabase backend â€” tables, auth, RLS, queries, and screen-by-screen breakdown.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Auth Strategy](#2-auth-strategy)
3. [Database Schema](#3-database-schema)
4. [Row-Level Security (RLS)](#4-row-level-security-rls)
5. [Helper Functions & Triggers](#5-helper-functions--triggers)
6. [Screen-by-Screen Query Reference](#6-screen-by-screen-query-reference)
7. [Service Layer Map](#7-service-layer-map)
8. [Business Rules Enforced by Supabase](#8-business-rules-enforced-by-supabase)
9. [Environment Variables & Setup Order](#9-environment-variables--setup-order)
10. [Seeding](#10-seeding)

---

## 1. Project Overview

SENDA tracks scholarship hours. Students register work time, dept heads approve it, accounting processes it for payment.

### Core status flow

```
Student creates log  â†’  PENDING
  Dept Head approves â†’  APPROVED
  Dept Head rejects  â†’  REJECTED  (with rejectionReason)
    Accounting pays  â†’  PROCESSED
```

### Billing cycle formula (replicated in `lib/business.ts`)

```
if day_of_month >= 26 â†’ cycle = next month (YYYY-MM)
else                  â†’ cycle = current month (YYYY-MM)
```

Cycle `2026-03` covers dates `2026-02-26` through `2026-03-25`.

### Financial formula (client-computed, must be consistent)

```
gross  = hours Ã— hourly_rate
tithe  = gross Ã— 0.10
net    = gross âˆ’ tithe
```

---

## 2. Auth Strategy

### 2.1 Why Supabase Auth

Supabase Auth handles JWTs, sessions, refresh, and password reset out of the box.  
The Supabase JS client (`supabase.auth`) exposes the session automatically via `onAuthStateChange`.

### 2.2 Email construction (login identifier â†’ Supabase email)

Supabase Auth requires an email. Since SENDA uses non-email identifiers, we build a synthetic internal email:

| Role | Login field | Synthetic email |
|---|---|---|
| `STUDENT` | `carnet` (e.g. `20240101`) | `20240101@senda.internal` |
| `DEPT_HEAD` | `employeeNumber` (e.g. `EMP-001`) | `emp-001@senda.internal` |
| `ADMIN` / `ACCOUNTING` / `SUPER_ADMIN` | `name` (normalized) | `ivonne-ramirez@senda.internal` |

**Helper:**
```typescript
export function buildAuthEmail(identifier: string): string {
  return `${identifier.toLowerCase().replace(/\s+/g, '-')}@senda.internal`;
}
```

Place this in `lib/utils.ts`. Use it in `LoginScreen` before calling `supabase.auth.signInWithPassword`.

### 2.3 Session lifecycle in the frontend

```typescript
// App.tsx â€” replace useState currentUser with:
supabase.auth.onAuthStateChange((_event, session) => {
  setCurrentUser(session?.user ?? null);
});

// On component mount:
const { data: { session } } = await supabase.auth.getSession();
```

After auth, fetch the user's profile **once** from `profiles` and store it in React state. All portal data reads then use `session.user.id` as `auth.uid()`.

### 2.4 Login flow

```typescript
// services/authService.ts

export async function login(identifier: string, password: string) {
  const email = buildAuthEmail(identifier);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  // Fetch profile from `profiles` table using data.user.id
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();
  return profile; // maps to our User type
}

export async function logout() {
  await supabase.auth.signOut();
}
```

### 2.5 Password reset (Super Admin)

Super Admin triggers a reset. Since there's no public email, an Admin must manually call the Supabase Admin API or a Supabase Edge Function:

```typescript
// Only callable from server/Edge Function (uses SERVICE_ROLE key, never expose to client)
await supabase.auth.admin.generateLink({
  type: 'recovery',
  email: buildAuthEmail(targetIdentifier),
});
```

The link can be shared with the user (copy-paste flow for internal apps).

---

## 3. Database Schema

Run these statements in the **Supabase SQL Editor** in this exact order.

### 3.1 Enum types

```sql
-- Role enum
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'DEPT_HEAD',
  'STUDENT',
  'ACCOUNTING'
);

-- Work log status enum
CREATE TYPE work_log_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PROCESSED'
);
```

### 3.2 `departments` table

```sql
CREATE TABLE departments (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name    TEXT NOT NULL UNIQUE,
  head_id UUID REFERENCES auth.users (id) ON DELETE SET NULL
);
```

> `head_id` references `auth.users` (same as FK in `profiles`). When a dept head's auth account is deleted, `head_id` becomes `NULL` automatically via `ON DELETE SET NULL`.

### 3.3 `profiles` table

Extends Supabase's built-in `auth.users`. One row per user.

```sql
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            user_role NOT NULL,
  carnet          TEXT UNIQUE,            -- STUDENT only. Login identifier.
  employee_number TEXT UNIQUE,            -- DEPT_HEAD only. Login identifier.
  department_id   UUID REFERENCES departments (id) ON DELETE SET NULL
);

-- Index for common filters
CREATE INDEX idx_profiles_role         ON profiles (role);
CREATE INDEX idx_profiles_department   ON profiles (department_id);
```

**Per-role field requirements:**

| Role | `carnet` | `employee_number` | `department_id` |
|---|---|---|---|
| `SUPER_ADMIN` | NULL | NULL | NULL |
| `ADMIN` | NULL | NULL | NULL |
| `ACCOUNTING` | NULL | NULL | NULL |
| `DEPT_HEAD` | NULL | required | optional (assigned by Admin) |
| `STUDENT` | required | NULL | optional (assigned by Admin) |

### 3.4 `work_logs` table

```sql
CREATE TABLE work_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  department_id    UUID NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
  date             DATE NOT NULL,
  hours            NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  description      TEXT NOT NULL CHECK (char_length(description) <= 200),
  status           work_log_status NOT NULL DEFAULT 'PENDING',
  rejection_reason TEXT CHECK (char_length(rejection_reason) <= 150),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for the most common query patterns
CREATE INDEX idx_work_logs_student      ON work_logs (student_id);
CREATE INDEX idx_work_logs_department   ON work_logs (department_id);
CREATE INDEX idx_work_logs_status       ON work_logs (status);
CREATE INDEX idx_work_logs_date         ON work_logs (date DESC);
CREATE INDEX idx_work_logs_dept_status  ON work_logs (department_id, status);

-- Constraint: rejection_reason is required when status = REJECTED
ALTER TABLE work_logs ADD CONSTRAINT chk_rejection_reason
  CHECK (
    status <> 'REJECTED' OR (rejection_reason IS NOT NULL AND char_length(rejection_reason) > 0)
  );
```

### 3.5 `hourly_rates` table

```sql
CREATE TABLE hourly_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate           NUMERIC(10, 2) NOT NULL CHECK (rate > 0),
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by     UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rates_effective ON hourly_rates (effective_date DESC);
```

> Rates are **append-only** â€” never updated or deleted. The active rate is always the row with the latest `effective_date â‰¤ today`.

---

## 4. Row-Level Security (RLS)

Enable RLS on all tables first:

```sql
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_rates ENABLE ROW LEVEL SECURITY;
```

### Helper function â€” get caller's role

```sql
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;
```

### Helper function â€” get caller's department

```sql
CREATE OR REPLACE FUNCTION current_user_department()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT department_id FROM profiles WHERE id = auth.uid();
$$;
```

---

### 4.1 `profiles` RLS policies

```sql
-- Anyone can read their own profile
CREATE POLICY "profiles: self_read"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- SUPER_ADMIN: reads all except other super admins
CREATE POLICY "profiles: superadmin_read"
  ON profiles FOR SELECT
  USING (
    current_user_role() = 'SUPER_ADMIN'
    AND role <> 'SUPER_ADMIN'
  );

-- ADMIN: reads all students, dept heads, accounting
CREATE POLICY "profiles: admin_read"
  ON profiles FOR SELECT
  USING (
    current_user_role() = 'ADMIN'
    AND role IN ('STUDENT', 'DEPT_HEAD', 'ACCOUNTING')
  );

-- DEPT_HEAD: reads only students in their own department
CREATE POLICY "profiles: depthead_read_students"
  ON profiles FOR SELECT
  USING (
    current_user_role() = 'DEPT_HEAD'
    AND role = 'STUDENT'
    AND department_id = current_user_department()
  );

-- ACCOUNTING: reads all students
CREATE POLICY "profiles: accounting_read_students"
  ON profiles FOR SELECT
  USING (
    current_user_role() = 'ACCOUNTING'
    AND role = 'STUDENT'
  );

-- SUPER_ADMIN: creates ADMIN and ACCOUNTING accounts
CREATE POLICY "profiles: superadmin_insert"
  ON profiles FOR INSERT
  WITH CHECK (
    current_user_role() = 'SUPER_ADMIN'
    AND role IN ('ADMIN', 'ACCOUNTING')
  );

-- ADMIN: creates DEPT_HEAD accounts
CREATE POLICY "profiles: admin_insert_depthead"
  ON profiles FOR INSERT
  WITH CHECK (
    current_user_role() = 'ADMIN'
    AND role = 'DEPT_HEAD'
  );

-- ADMIN: creates STUDENT accounts (future)
CREATE POLICY "profiles: admin_insert_student"
  ON profiles FOR INSERT
  WITH CHECK (
    current_user_role() = 'ADMIN'
    AND role = 'STUDENT'
  );

-- ADMIN: updates department assignment of students / dept heads
CREATE POLICY "profiles: admin_update"
  ON profiles FOR UPDATE
  USING (current_user_role() = 'ADMIN')
  WITH CHECK (role IN ('STUDENT', 'DEPT_HEAD'));

-- ADMIN: deletes dept head accounts only
CREATE POLICY "profiles: admin_delete_depthead"
  ON profiles FOR DELETE
  USING (
    current_user_role() = 'ADMIN'
    AND role = 'DEPT_HEAD'
  );
```

---

### 4.2 `departments` RLS policies

```sql
-- All authenticated users can read departments
CREATE POLICY "departments: all_read"
  ON departments FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only ADMIN can create departments
CREATE POLICY "departments: admin_insert"
  ON departments FOR INSERT
  WITH CHECK (current_user_role() = 'ADMIN');

-- Only ADMIN can update departments
CREATE POLICY "departments: admin_update"
  ON departments FOR UPDATE
  USING (current_user_role() = 'ADMIN');

-- Only ADMIN can delete departments
-- Note: In practice, soft-deletion or protection against departments with logs is recommended
CREATE POLICY "departments: admin_delete"
  ON departments FOR DELETE
  USING (current_user_role() = 'ADMIN');
```

---

### 4.3 `work_logs` RLS policies

```sql
-- STUDENT: reads own logs only
CREATE POLICY "work_logs: student_read"
  ON work_logs FOR SELECT
  USING (
    current_user_role() = 'STUDENT'
    AND student_id = auth.uid()
  );

-- STUDENT: creates PENDING logs for their own department
CREATE POLICY "work_logs: student_insert"
  ON work_logs FOR INSERT
  WITH CHECK (
    current_user_role() = 'STUDENT'
    AND student_id = auth.uid()
    AND department_id = current_user_department()
    AND status = 'PENDING'
  );

-- DEPT_HEAD: reads all logs in their department
CREATE POLICY "work_logs: depthead_read"
  ON work_logs FOR SELECT
  USING (
    current_user_role() = 'DEPT_HEAD'
    AND department_id = current_user_department()
  );

-- DEPT_HEAD: creates APPROVED logs for their department (manual entry)
CREATE POLICY "work_logs: depthead_insert"
  ON work_logs FOR INSERT
  WITH CHECK (
    current_user_role() = 'DEPT_HEAD'
    AND department_id = current_user_department()
    AND status = 'APPROVED'
  );

-- DEPT_HEAD: updates status PENDING â†’ APPROVED or REJECTED (own dept only)
CREATE POLICY "work_logs: depthead_update_status"
  ON work_logs FOR UPDATE
  USING (
    current_user_role() = 'DEPT_HEAD'
    AND department_id = current_user_department()
    AND status = 'PENDING'
  )
  WITH CHECK (status IN ('APPROVED', 'REJECTED'));

-- ACCOUNTING: reads all logs
CREATE POLICY "work_logs: accounting_read"
  ON work_logs FOR SELECT
  USING (current_user_role() = 'ACCOUNTING');

-- ACCOUNTING: updates APPROVED â†’ PROCESSED (bulk payroll)
CREATE POLICY "work_logs: accounting_process"
  ON work_logs FOR UPDATE
  USING (
    current_user_role() = 'ACCOUNTING'
    AND status = 'APPROVED'
  )
  WITH CHECK (status = 'PROCESSED');

-- ADMIN: reads all logs (dashboard, reports)
CREATE POLICY "work_logs: admin_read"
  ON work_logs FOR SELECT
  USING (current_user_role() = 'ADMIN');
```

---

### 4.4 `hourly_rates` RLS policies

```sql
-- All authenticated users can read rates (to compute financials)
CREATE POLICY "hourly_rates: all_read"
  ON hourly_rates FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only ADMIN can insert new rate records
CREATE POLICY "hourly_rates: admin_insert"
  ON hourly_rates FOR INSERT
  WITH CHECK (current_user_role() = 'ADMIN');
```

---

## 5. Helper Functions & Triggers

### 5.1 Auto-update `updated_at` on `work_logs`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER work_logs_updated_at
  BEFORE UPDATE ON work_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### 5.2 Auto-create profile row when a new auth user is created

```sql
-- Triggered by Supabase Auth after supabase.auth.admin.createUser()
-- Requires role, name (and optionally carnet/employee_number/department_id)
-- passed via the user's `raw_user_meta_data` field.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, name, role, carnet, employee_number, department_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    (NEW.raw_user_meta_data ->> 'role')::user_role,
    NEW.raw_user_meta_data ->> 'carnet',
    NEW.raw_user_meta_data ->> 'employee_number',
    (NEW.raw_user_meta_data ->> 'department_id')::UUID
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

> **Important:** Pass all profile fields as `user_metadata` when creating users via `supabase.auth.admin.createUser({ email, password, user_metadata: { name, role, carnet, ... } })`.

### 5.3 Get current active hourly rate

```sql
CREATE OR REPLACE FUNCTION get_current_rate()
RETURNS NUMERIC
LANGUAGE sql
STABLE
AS $$
  SELECT rate
  FROM hourly_rates
  WHERE effective_date <= CURRENT_DATE
  ORDER BY effective_date DESC
  LIMIT 1;
$$;
```

### 5.4 Auto-clear dept head when dept head account is deleted

The `head_id` FK on `departments` already uses `ON DELETE SET NULL`, so this is handled automatically by the schema.

---

## 6. Screen-by-Screen Query Reference

All queries below use `supabase` from `api/supabaseClient.ts`. Import pattern:

```typescript
import { supabase, TABLES, mapUser, mapDepartment, mapWorkLog } from '../api';
```

---

### 6.1 LoginScreen

**Action:** Sign in with username + password.

```typescript
// services/authService.ts

export async function login(identifier: string, password: string): Promise<User> {
  const email = buildAuthEmail(identifier); // lib/utils.ts
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error('Credenciales incorrectas.');

  const { data, error } = await supabase
    .from(TABLES.PROFILES)
    .select('*')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single();

  if (error || !data) throw new Error('No se encontrÃ³ el perfil del usuario.');
  return mapUser(data);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}
```

**Queries used:**
- `supabase.auth.signInWithPassword`
- `supabase.from('profiles').select('*').eq('id', uid).single()`

---

### 6.2 SuperAdmin Portal

**UI layout:** 12-column grid — left 8 cols (account list + student help section), right 4 cols (create form).

**Left — Account List (`SuperAdminAccountList`):**
- Search bar filters ADMIN + ACCOUNTING accounts by name
- Per row: name, role badge, "Resetear Contraseña" button
- Confirmation dialog before password reset fires
- On confirm: calls Edge Function → toast "Enlace de restablecimiento enviado"

**Left — Student Help (`SuperAdminStudentHelp`):**
- A separate search bar filters STUDENT accounts by name/carnet
- Per row: name, carnet, "Resetear Contraseña" button (same flow as above)
- Purpose: let SuperAdmin help students who forget their carnet-based password

**Right — Create Form (`SuperAdminCreateForm`):**
- Fields: full name (text), role selector (`ADMIN` | `ACCOUNTING`), temporary password (text, min 8 chars)
- Submit → Edge Function `create-user` → creates auth user + triggers `handle_new_user` → profile row inserted

**Reads:**
```typescript
// List ADMIN + ACCOUNTING accounts (filtered by name search)
const { data } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, role')
  .in('role', ['ADMIN', 'ACCOUNTING'])
  .ilike('name', `%${adminSearch}%`);

// List STUDENT accounts (name+carnet search done client-side)
const { data } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, role, carnet')
  .eq('role', 'STUDENT');
```

**Create Admin/Accounting account:**
```typescript
// Edge Function: /functions/create-user
// Body: { name, role: 'ADMIN'|'ACCOUNTING', password }
// Edge Function builds: email = buildAuthEmail(name) → name-normalized@senda.internal
await supabase.functions.invoke('create-user', {
  body: { name, role, password },
});
```

**Reset password (for any role):**
```typescript
// Edge Function: /functions/reset-password
// Body: { userId }
// Edge Function calls supabase.auth.admin.generateLink({ type:'recovery', email })
await supabase.functions.invoke('reset-password', {
  body: { userId },
});
// Response shows toast: "Contraseña temporal enviada"
```

### 6.3 Admin Portal — Dashboard Tab

**UI controls:**
- **Cycle selector** — dropdown covering the last **12** billing cycles (computed from today backwards)
- KPI cards: `totalHours` | `activeStudents` | `totalGlobalPayment`
- Bar chart: top 5 students by hours (RECHARTS `BarChart`)
- Pie chart: hours distribution by department (RECHARTS `PieChart` donut)
- Full **Work Log Table** at the bottom — all logs for the selected cycle, with student + department columns
- Export: CSV (`reporte_general.csv`) and PDF (`reporte_general.pdf`) of the full log table

**Reads all work logs + users + departments for a billing cycle:**

```typescript
// Work logs for selected cycle (date range filter)
const [start, end] = cycleToDateRange(selectedCycle); // see Appendix C
const { data: logs } = await supabase
  .from(TABLES.WORK_LOGS)
  .select('*')
  .gte('date', start)
  .lte('date', end)
  .order('date', { ascending: false });

// All profiles (for name lookup + active student count + chart labels)
const { data: users } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, role, department_id, carnet, employee_number')
  .neq('role', 'SUPER_ADMIN');

// All departments (for pie chart labels)
const { data: departments } = await supabase
  .from(TABLES.DEPARTMENTS)
  .select('*');
```

**Client-side derived stats** (no extra queries):
- `totalHours` — sum of `hours` across all logs in cycle
- `activeStudents` — count of unique `studentId` values in cycle logs
- `totalGlobalPayment` — `totalHours × currentRate`
- `studentChartData` — group by student → sort desc → top 5
- `deptChartData` — group by department → hours per dept

**Export:** CSV and PDF generated client-side from the cycle-filtered logs array.

### 6.4 Admin Portal — Students Tab

**UI controls:**
- Search bar (filters by name or carnet, client-side)
- Per-row action buttons: "Cambiar Departamento" (arrow-right icon) | "Quitar del Departamento" (user-minus icon, only shown when student has a dept)
- "Cambiar Departamento" opens a modal listing **all departments as buttons** — clicking one immediately reassigns
- "Quitar del Departamento" fires a `useConfirm` dialog then sets `department_id = null`
- "Nuevo Estudiante" button is **disabled** (marked as "próximamente")

**Read students (all, search done client-side):**
```typescript
const { data } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, role, carnet, department_id')
  .eq('role', 'STUDENT');
```

**Reassign student to department (click a dept button in modal):**
```typescript
const { error } = await supabase
  .from(TABLES.PROFILES)
  .update({ department_id: newDeptId })
  .eq('id', studentId)
  .eq('role', 'STUDENT');
```

**Remove student from department (confirm dialog → confirm):**
```typescript
const { error } = await supabase
  .from(TABLES.PROFILES)
  .update({ department_id: null })
  .eq('id', studentId)
  .eq('role', 'STUDENT');
```

**Create student account — disabled for now (future Edge Function):**
```typescript
// Edge Function: /functions/create-user
// Body: { name, role: 'STUDENT', carnet, departmentId?, password }
// email = buildAuthEmail(carnet) → e.g. "stu-20240001@senda.internal"
```

### 6.5 Admin Portal — Dept Heads Tab

**UI controls:**
- Search bar (filters by name, client-side)
- Per-row: name | employee number | assigned department badge | trash icon (delete)
- Delete fires a `useConfirm` dialog then calls Edge Function `delete-user`
- "Nuevo Jefe de Depto." button → opens create modal

**Create modal fields:**
- Nombre (text, required)
- Número de Empleado (text, required — used as login identifier)
- Departamento (select from existing departments, optional)

**Read dept heads:**
```typescript
const { data } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, role, employee_number, department_id')
  .eq('role', 'DEPT_HEAD');
// name search done client-side
```

**Create dept head:**
```typescript
// Edge Function: /functions/create-user
// Body: { name, role: 'DEPT_HEAD', employeeNumber, departmentId?, password }
// email = buildAuthEmail(employeeNumber) → e.g. "emp-00042@senda.internal"
await supabase.functions.invoke('create-user', {
  body: { name, role: 'DEPT_HEAD', employeeNumber, departmentId: deptId ?? null, password },
});
// handle_new_user trigger inserts the profile row automatically
```

**Delete dept head (confirm dialog → delete):**
```typescript
// Edge Function: /functions/delete-user
// Body: { userId }
// Deletes from auth.users → cascades to profiles (ON DELETE CASCADE)
// → departments.head_id becomes NULL via (ON DELETE SET NULL)
await supabase.functions.invoke('delete-user', {
  body: { userId },
});
```

### 6.6 Admin Portal — Departments Tab

**UI layout:** Grid of department **cards** (1 col mobile → 2 cols tablet → 3 cols desktop). Each card shows:
- Department name + pencil (edit) icon button
- Jefe: head name (looked up from users list), or "No asignado"
- Estudiantes: count of profiles where `role=STUDENT AND department_id=dept.id`
- Horas del Ciclo: sum of work_log hours for this dept in the currently selected cycle  
  (both computed client-side from existing state — no extra queries)

**Toolbar:** "Nuevo Departamento" button (top-right of tab heading)

**Create/Edit modal fields:**
- Nombre (text, required)
- Jefe de Departamento (select from DEPT_HEAD profiles, optional — "Sin jefe" option)

**Read all departments:**
```typescript
const { data } = await supabase
  .from(TABLES.DEPARTMENTS)
  .select('*');
// Student count, cycle hours, and head name are computed client-side
// from useUsers() and useWorkLogs() data already in state
```

**Create department:**
```typescript
const { data, error } = await supabase
  .from(TABLES.DEPARTMENTS)
  .insert({ name: deptName, head_id: headId ?? null })
  .select()
  .single();
```

**Edit department (name or head):**
```typescript
const { error } = await supabase
  .from(TABLES.DEPARTMENTS)
  .update({ name: newName, head_id: newHeadId ?? null })
  .eq('id', deptId);

// When assigning a dept head, also update their profile.department_id so they can
// access their dept's data from DeptHeadPortal:
if (newHeadId) {
  await supabase
    .from(TABLES.PROFILES)
    .update({ department_id: deptId })
    .eq('id', newHeadId);
}
// If swapping heads, null out the old head's department_id first
if (oldHeadId && oldHeadId !== newHeadId) {
  await supabase
    .from(TABLES.PROFILES)
    .update({ department_id: null })
    .eq('id', oldHeadId);
}
```

### 6.7 Admin Portal â€” Rate Modal

**Read current rate:**
```typescript
const { data } = await supabase
  .from(TABLES.RATES)
  .select('rate, effective_date')
  .lte('effective_date', new Date().toISOString().split('T')[0])
  .order('effective_date', { ascending: false })
  .limit(1)
  .single();
```

**Update rate (insert new record):**
```typescript
// Frontend sends the rate + ratePassword to a Supabase Edge Function
// The Edge Function validates the password server-side before inserting

// Edge Function: /functions/update-rate
const { data, error } = await supabase
  .from(TABLES.RATES)
  .insert({
    rate: newRate,
    effective_date: new Date().toISOString().split('T')[0],
    created_by: auth.uid(),  // available in Edge Function via req headers
  })
  .select()
  .single();
```

> **Rate password validation** must happen in an Edge Function or PostgreSQL function â€” never client-side. Store the password in a Supabase secret (`supabase secrets set ADMIN_RATE_PASSWORD=...`).

---

### 6.8 Dept Head Portal

**UI layout:** Full-width container. Header row has cycle selector (12-month dropdown). Below that: 5 KPI cards across full width. Main area splits into `lg:col-span-8` (pending + history) and `lg:col-span-4` (sticky manual log form).

**Cycle selector:** dropdown covering the last **12** billing cycles (same algorithm as Admin — `Array.from({length:12}, (_,i) => ...)` going backwards from current cycle).

**5 KPI cards:**
| Card label | Value |
|---|---|
| Estudiantes | `myStudents.length` (all students in dept) |
| Horas Ciclo | sum of ALL log hours in cycle (all statuses) |
| Pendientes | sum of PENDING log hours in cycle |
| Aprobadas | sum of APPROVED log hours in cycle |
| Facturación | `formatCurrency(approvedHours × currentRate)` |

**Pending section:**
- Shows only logs with `status === PENDING` in the selected cycle
- Per-row: Approve ✅ button | Reject ❌ button (opens rejection modal)
- "Aprobar Todo" button (only shown when pendingLogs.length > 0) — fires `useConfirm` dialog, then bulk-updates all

**Rejection modal:** Textarea for `rejectionReason` (max 150 chars per `LIMITS.REJECTION_REASON`). Submit button disabled if textarea empty.

**Department history table:**
- Shows logs where `status !== PENDING` (i.e. APPROVED, PROCESSED, REJECTED) in the selected cycle
- Columns: student name | date | hours | description | status badge
- REJECTED rows show `rejectionReason` tooltip/sub-text

**Manual log form (sticky sidebar):**
- Student picker (select from `myStudents`)
- Date picker (date input)
- Hours (number input, `step=0.5`, `min=0.5`)
- Description (textarea, `maxLength=200`)
- All fields required — `toast.error` if any missing
- Submitted log goes directly to APPROVED (bypasses PENDING)
- Export: CSV (`reporte_${departmentName}.csv`) and PDF (`reporte_${departmentName}.pdf`) of ALL dept logs in selected cycle

**Read dept's work logs (all at once — filtered client-side per cycle):**
```typescript
const { data } = await supabase
  .from(TABLES.WORK_LOGS)
  .select('*')
  .eq('department_id', user.departmentId)
  .order('date', { ascending: false });
```

**Read dept's students:**
```typescript
const { data } = await supabase
  .from(TABLES.PROFILES)
  .select('id, name, carnet')
  .eq('role', 'STUDENT')
  .eq('department_id', user.departmentId);
```

**Approve a single log:**
```typescript
const { error } = await supabase
  .from(TABLES.WORK_LOGS)
  .update({ status: 'APPROVED' })
  .eq('id', logId)
  .eq('status', 'PENDING')         // guard: only if still pending
  .eq('department_id', user.departmentId);
```

**Reject a single log (from rejection modal):**
```typescript
// Validation: rejectionReason.trim() not empty, length <= 150
const { error } = await supabase
  .from(TABLES.WORK_LOGS)
  .update({ status: 'REJECTED', rejection_reason: rejectionReason })
  .eq('id', logId)
  .eq('status', 'PENDING')
  .eq('department_id', user.departmentId);
```

**Approve ALL pending logs ("Aprobar Todo" — after confirm dialog):**
```typescript
const pendingIds = pendingLogs.map(l => l.id);
const { error } = await supabase
  .from(TABLES.WORK_LOGS)
  .update({ status: 'APPROVED' })
  .in('id', pendingIds)
  .eq('status', 'PENDING');
```

**Register hours manually (manual log form — creates as APPROVED):**
```typescript
// Timer session stored in localStorage key: `senda_session_{userId}`
const { data, error } = await supabase
  .from(TABLES.WORK_LOGS)
  .insert({
    student_id: selectedStudentId,
    department_id: user.departmentId,
    date: selectedDate,           // YYYY-MM-DD string
    hours: parseFloat(hoursInput),
    description,
    status: 'APPROVED',           // Dept Head manual entries bypass PENDING
  })
  .select()
  .single();
```

### 6.9 Student Portal

**UI layout:** Profile header (full-width dark card) above a two-column main area.

**Profile header (`StudentProfile`):**
- Large initial avatar, full name, carnet badge, "Estudiante Activo" badge
- `totalHours` — sum of ALL own log hours, **ALL statuses, ALL time** (not period-filtered)
- `currentRate` displayed (current hourly rate)

**Left column (`lg:col-span-7`) — History section (`StudentHistory`):**
- Tab toggle: `Mes` (billing cycle view) | `Cuatri` (trimester view)
- **Cycle view:** dropdown of last **6** billing cycles
- **Trimester view:** trimester picker (1/2/3, filtered to ≤ current trimester) + year picker
  - Year options: 2024, 2025 — filtered to ≤ current trimester's year
- `WorkLogTable` showing period-filtered logs with per-row status badges:
  - PENDING → yellow badge
  - APPROVED → green badge
  - PROCESSED → indigo badge
  - REJECTED → red badge + shows `rejectionReason` sub-text
- Export: CSV (`mis_horas_${name.replace(/\s+/g,'_')}.csv`) and PDF of **all** own logs (unfiltered)

**Right column (`lg:col-span-5`):**
- **Timer widget (`StudentTimer`)** — dark-background card
  - Start timer → stores `{ start: Date.now(), desc: '' }` in `localStorage` key: `senda_session_{userId}`
  - While running: shows elapsed HH:MM:SS countdown + description textarea
  - "Registrar Horas" button → validates description → inserts log → clears localStorage → resets state
  - "Cancelar" button → clears localStorage → resets state (no backend call)
- **Financials section (`StudentFinancials`)**
  - Computed from **ALL** own logs (same total as profile header):
    - `totalHours` = sum of all log hours (all statuses, all time)
    - `grossAmount` = totalHours × currentRate
    - `tithe` = grossAmount × 0.10
    - `netAmount` = grossAmount − tithe
  - Cards: Total Neto | Diezmo (10%) | Próximo Corte (25th of current cycle month)

**Read own work logs:**
```typescript
const { data } = await supabase
  .from(TABLES.WORK_LOGS)
  .select('*')
  .eq('student_id', auth.uid())
  .order('date', { ascending: false });
```

**Submit hours from timer:**
```typescript
// Validation: description not empty, description.length <= 200 (LIMITS.DESCRIPTION)
// Hours = (Date.now() - sessionStart) / 3_600_000  (rounded to 2 decimal places)
const { data, error } = await supabase
  .from(TABLES.WORK_LOGS)
  .insert({
    student_id: auth.uid(),
    department_id: user.departmentId,   // student MUST have a dept to submit hours
    date: new Date().toISOString().split('T')[0],
    hours: parseFloat(elapsedHours.toFixed(2)),
    description,
    status: 'PENDING',
  })
  .select()
  .single();
// On success: clear localStorage session key, reset timer to idle state
```

### 6.10 Accounting Portal

**UI layout:** Full-width toolbar at top, then 2 KPI cards, charts row (bar + pie + weekly summary), then payroll detail table.

**2 KPI cards:**
| Card | Value computed from |
|---|---|
| Pendiente de Pago | `totalApprovedAmount` = sum of (hours × currentRate) for APPROVED logs in selected period |
| Total Procesado | `totalProcessedAmount` = sum of (hours × currentRate) for PROCESSED logs in selected period |

> There is **no third KPI card** (no "active students" count card in this portal).

**Toolbar controls (left to right):**
1. Student name search (text input — filters `approvedForPayroll` rows client-side)
2. Department dropdown (`all` | each department name)
3. View mode toggle: `Ciclo` | `Cuatrimestre`
4. Period selector:
   - **Ciclo mode:** 12-month dropdown (same algorithm as DeptHead — last 12 billing cycles)
   - **Cuatrimestre mode:** trimester picker (1 / 2 / 3, filtered to ≤ current trimester) + year picker (2024, 2025, 2026, filtered to ≤ current trimester year)
5. Export buttons: CSV and PDF

**Charts:**
- Bar chart: top 5 students by approved gross amount
- Pie chart: approved hours distribution by department
- Weekly summary list: ISO week → total approved hours + gross for that week

**Payroll table (`AccountingPayrollTable`) — "Detalle de Nómina":**
- Rows: one per student, aggregated from the `approvedForPayroll` array
- Columns: Estudiante | Departamento | Horas Totales | Monto Bruto | Diezmo (10%) | Monto Neto
- Footer row: "Procesar Pagos" button — only shown when `approvedForPayroll.length > 0`
- Clicking "Procesar Pagos" fires a `useConfirm` dialog, then updates all APPROVED → PROCESSED

> `processedForPayroll` (PROCESSED logs in period) is computed in `useAccountingData` and feeds **only** `totalProcessedAmount` KPI — there is **no separate processed table** rendered in the UI.

**Export filename patterns:**
```
// Cycle mode:
nomina_cycle_${selectedCycle}.csv          // e.g. nomina_cycle_2026-03.csv
// Trimester mode:
nomina_trimester_${selectedTrimester}.csv  // e.g. nomina_trimester_1.csv
```
Exported columns: Estudiante, Departamento, Horas Totales, Monto Bruto, Diezmo (10%), Monto Neto.

**Read all work logs (all fetched upfront — period filtering done client-side):**
```typescript
// ALL logs, no date filter on the server — useAccountingData applies period math client-side
const { data } = await supabase
  .from(TABLES.WORK_LOGS)
  .select('*')
  .order('date', { ascending: false });
```

**Read all users + departments (for row labels — shared from app state):**
```typescript
// Done once via useUsers() and useDepartments() — already in shared state, no extra query
```

**Process payroll ("Procesar Pagos" — after confirm dialog):**
```typescript
// 1. Gather all logIds from the approvedForPayroll aggregated rows
const approvedIds = approvedForPayroll.flatMap(item => item.logIds);

// 2. Bulk update APPROVED → PROCESSED
const { error } = await supabase
  .from(TABLES.WORK_LOGS)
  .update({ status: 'PROCESSED' })
  .in('id', approvedIds)
  .eq('status', 'APPROVED');   // guard against race conditions

// 3. On success: toast "Pagos procesados", refresh logs
```

> For large payroll batches, wrap in a Supabase Edge Function with a PostgreSQL transaction to guarantee atomicity.

## 7. Service Layer Map

The existing service files in `services/` already have the Supabase query blocks commented out. This table maps each service function to its Supabase equivalents.

| Service function | Table | Operation | Supabase method |
|---|---|---|---|
| `getUsers()` | `profiles` | READ all (role-scoped by RLS) | `.from('profiles').select('*')` |
| `createUser()` | `auth.users` + `profiles` | CREATE via trigger | `auth.admin.createUser()` (Edge Fn) |
| `patchUser(id, updates)` | `profiles` | UPDATE `department_id` | `.update(updates).eq('id', id)` |
| `deleteUser(id)` | `auth.users` | DELETE (cascades to profiles) | `auth.admin.deleteUser(id)` (Edge Fn) |
| `getDepartments()` | `departments` | READ all | `.from('departments').select('*')` |
| `createDepartment()` | `departments` | INSERT | `.insert(data).select().single()` |
| `patchDepartment(id, updates)` | `departments` | UPDATE | `.update({name, head_id}).eq('id', id)` |
| `getWorkLogs()` | `work_logs` | READ (RLS-scoped) | `.from('work_logs').select('*').order('date', {ascending:false})` |
| `createWorkLog()` | `work_logs` | INSERT | `.insert(data).select().single()` |
| `patchWorkLogStatus(id, status, reason)` | `work_logs` | UPDATE status | `.update({status, rejection_reason}).eq('id', id)` |
| `bulkPatchWorkLogStatus(updates)` | `work_logs` | UPDATE many | `.update({status}).in('id', ids)` |
| `getCurrentRate()` | `hourly_rates` | READ latest | `.select('rate').lte('effective_date', today).order(...).limit(1).single()` |
| `updateRate(rate)` | `hourly_rates` | INSERT new record | Edge Function: validate password â†’ `.insert({rate, effective_date, created_by})` |

---

## 8. Business Rules Enforced by Supabase

| Rule | Enforcement layer |
|---|---|
| `hours > 0` | PostgreSQL `CHECK (hours > 0)` |
| `description â‰¤ 200 chars` | PostgreSQL `CHECK (char_length(description) <= 200)` |
| `rejection_reason â‰¤ 150 chars` | PostgreSQL `CHECK (char_length(rejection_reason) <= 150)` |
| `rejection_reason` required when REJECTED | PostgreSQL `CHECK` constraint `chk_rejection_reason` |
| Status transition PENDINGâ†’APPROVED/REJECTED | RLS `USING (status = 'PENDING')` for dept head update |
| Status transition APPROVEDâ†’PROCESSED | RLS `USING (status = 'APPROVED')` for accounting update |
| Dept head can only act on own department | RLS `department_id = current_user_department()` |
| Student can only submit logs for own department | RLS `department_id = current_user_department()` |
| Student log always created as PENDING | RLS `WITH CHECK (status = 'PENDING')` |
| Dept head log always created as APPROVED | RLS `WITH CHECK (status = 'APPROVED')` |
| Rate records never modified | No UPDATE policy on `hourly_rates` |
| Rate is always the latest â‰¤ today | Query: `ORDER BY effective_date DESC LIMIT 1` |

---

## 9. Environment Variables & Setup Order

### Frontend `.env.local`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # Public anon key â€” safe for browser
```

> Never use the `service_role` key in the browser. It bypasses all RLS.

### Supabase Secrets (for Edge Functions)

```bash
supabase secrets set ADMIN_RATE_PASSWORD=admin123
supabase secrets set ADMIN_CREATE_KEY=some_internal_secret
```

### Edge Functions needed

| Function name | Trigger | Reason for Edge Function |
|---|---|---|
| `create-user` | Admin/SuperAdmin creates accounts | Requires `service_role` key |
| `delete-user` | Admin deletes a dept head | Requires `service_role` key |
| `reset-password` | SuperAdmin resets a password | Requires `service_role` key |
| `update-rate` | Admin updates hourly rate | Validates `ADMIN_RATE_PASSWORD` server-side |

Everything else is called directly from the browser using the **anon key + RLS**.

### Setup order

```
1. Create Supabase project
2. Run SQL: enum types  (section 3.1)
3. Run SQL: departments table  (section 3.2)
4. Run SQL: profiles table  (section 3.3)
5. Run SQL: work_logs table  (section 3.4)
6. Run SQL: hourly_rates table  (section 3.5)
7. Enable RLS on all tables  (section 4 preamble)
8. Create helper functions  (section 5.1â€“5.3)
9. Create handle_new_user trigger  (section 5.2)
10. Create RLS policies â€” profiles  (section 4.1)
11. Create RLS policies â€” departments  (section 4.2)
12. Create RLS policies â€” work_logs  (section 4.3)
13. Create RLS policies â€” hourly_rates  (section 4.4)
14. Deploy Edge Functions  (section 9)
15. Seed initial data  (section 10)
16. Add .env.local to frontend  (section 9)
17. Uncomment Supabase blocks in services/  â†’ delete api/__mocks__.ts
```

---

## 10. Seeding

Run in SQL Editor after all tables and policies exist.

### 10.1 First hourly rate

```sql
-- Temporarily disable RLS for seeding (re-enable after)
-- Or use the Supabase Dashboard "Table Editor" with the service role.

INSERT INTO hourly_rates (rate, effective_date, created_by)
SELECT 1500, '2024-01-01', id FROM profiles WHERE role = 'ADMIN' LIMIT 1;
```

### 10.2 Initial users

Use the Supabase Dashboard â†’ Authentication â†’ Users â†’ "Add user" (or a seed Edge Function).

For every initial user, call:
```typescript
await supabase.auth.admin.createUser({
  email: buildAuthEmail(identifier),  // e.g. '20240101@senda.internal'
  password: 'TemporalPassword123!',
  user_metadata: {
    name: 'Marvin Moncada',
    role: 'STUDENT',
    carnet: '20240101',
    department_id: '<uuid-of-dept-uv>',
  },
  email_confirm: true,
});
```

The `handle_new_user` trigger will insert the corresponding `profiles` row automatically.

### 10.3 Departments (seed directly)

```sql
INSERT INTO departments (id, name) VALUES
  (gen_random_uuid(), 'U Virtual'),
  (gen_random_uuid(), 'Mantenimiento'),
  (gen_random_uuid(), 'Biblioteca');
```

Then link dept heads via `UPDATE profiles SET department_id = ... WHERE ...` and `UPDATE departments SET head_id = ... WHERE ...`.

---

## Appendix A â€” `supabaseClient.ts` Table Constants

The `TABLES` object in `api/supabaseClient.ts` mirrors the Supabase table names:

```typescript
export const TABLES = {
  PROFILES:   'profiles',    // â† was 'users' in old REST spec
  DEPARTMENTS: 'departments',
  WORK_LOGS:  'work_logs',
  RATES:      'hourly_rates',
} as const;
```

> Note: the table is `profiles`, not `users`. The `auth.users` table is managed by Supabase Auth.

---

## Appendix B â€” Shared Types Reference

```typescript
// types.ts  (frontend â€” mirror exactly in backend/DB)
enum UserRole        { SUPER_ADMIN, ADMIN, DEPT_HEAD, STUDENT, ACCOUNTING }
enum WorkLogStatus   { PENDING, APPROVED, REJECTED, PROCESSED }

interface User {
  id:             string;   // = auth.uid()
  name:           string;
  role:           UserRole;
  carnet?:        string;   // STUDENT only
  employeeNumber?: string;  // DEPT_HEAD only
  departmentId?:  string;   // STUDENT + DEPT_HEAD
}

interface Department {
  id:     string;
  name:   string;
  headId?: string;
}

interface WorkLog {
  id:              string;
  studentId:       string;
  departmentId:    string;
  date:            string;   // YYYY-MM-DD
  hours:           number;
  description:     string;   // â‰¤ 200 chars
  status:          WorkLogStatus;
  rejectionReason?: string;  // â‰¤ 150 chars, required if REJECTED
}

interface HourlyRate {
  id:            string;
  rate:          number;
  effectiveDate: string;
}

const LIMITS = { DESCRIPTION: 200, REJECTION_REASON: 150 };
```

---

## Appendix C â€” `cycleToDateRange` Utility

Used in queries that need to filter logs by billing cycle string:

```typescript
// lib/utils.ts  (add this)
export function cycleToDateRange(cycle: string): [string, string] {
  const [year, month] = cycle.split('-').map(Number);
  const start = new Date(year, month - 2, 26); // 26th of previous month
  const end   = new Date(year, month - 1, 25); // 25th of cycle month
  return [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0],
  ];
}
// cycleToDateRange('2026-03') â†’ ['2026-02-26', '2026-03-25']
```

---

*Last updated: February 2026 â€” targets SENDA frontend at FASE 4. Supabase JS client v2.*


---

## Appendix D - Kiosk Mode

### Overview

Kiosk mode turns a shared department PC into a time-clock board. Students clock in/out
using their own credentials. The dept head (or super admin) activates and manages the
kiosk without sharing their account.

### Auth model (all actions require credentials)

| Action | Who |
|---|---|
| Activate kiosk | Dept head or Super Admin |
| Clock in | Student (carnet + password) |
| Clock out | Student (carnet + password) |
| Cancel session | Dept head + reason |
| Update shifts | Dept head |
| Deactivate | Dept head or Super Admin |

Currently validated via mockValidateCredentials() in useKiosk.ts.
Replace with supabase.auth.signInWithPassword() when backend is live.

### Types already in types.ts

interface KioskSession { studentId: string; startedAt: string; }
interface KioskShift   { startTime: string; endTime: string; }
interface KioskState {
  departmentId: string; activatedBy: string; activatedAt: string;
  sessions: KioskSession[]; shifts: KioskShift[];
}

### Supabase schema additions

create table kiosk_state (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references departments(id) on delete cascade,
  activated_by  uuid not null references profiles(id),
  activated_at  timestamptz not null default now(),
  shifts        jsonb not null default '[]',
  unique(department_id)
);

create table kiosk_sessions (
  id         uuid primary key default gen_random_uuid(),
  kiosk_id   uuid not null references kiosk_state(id) on delete cascade,
  student_id uuid not null references profiles(id),
  started_at timestamptz not null default now(),
  unique(kiosk_id, student_id)
);

### Supabase Realtime (remote activation by super admin)

Wire inside the empty useEffect in useKiosk.ts:

  const channel = supabase
    .channel('kiosk:{departmentId}')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'kiosk_state',
        filter: 'department_id=eq.{departmentId}' }, payload => {
      setKiosk({ departmentId: payload.new.department_id, activatedBy: payload.new.activated_by,
                 activatedAt: payload.new.activated_at, sessions: [], shifts: payload.new.shifts ?? [] });
    }).subscribe();

### Clock-out work log

Clock-out calls addWorkLog() with status PENDING -> feeds into existing approval flow.
Cancelled sessions saved as REJECTED with a reason.

### Migration checklist

- [ ] Run kiosk schema SQL (kiosk_state + kiosk_sessions)
- [ ] Apply RLS (dept head + super admin manage kiosk_state; students own session row)
- [ ] Replace mockValidateCredentials with supabase.auth.signInWithPassword()
- [ ] Wire Supabase Realtime in useKiosk.ts for remote activation
