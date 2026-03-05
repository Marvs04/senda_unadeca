/**
 * hooks/useKiosk.ts
 *
 * Manages kiosk mode state for a department.
 *
 * Auth model (all actions require credentials):
 *   - Activate kiosk   → dept head or super admin password
 *   - Clock in         → student carnet + password
 *   - Clock out        → student carnet + password
 *   - Cancel session   → dept head password + reason
 *   - Deactivate kiosk → dept head or super admin password
 *
 * Passwords are validated against MOCK_USERS today.
 * When Supabase is live → call supabase.auth.signInWithPassword()
 * and check the returned user's role before allowing the action.
 *
 * KioskState is stored in memory only (no localStorage).
 * Remote activation by super admin requires Supabase Realtime (see BACKEND_SPEC §Kiosk).
 */

import { useState, useEffect, useCallback } from 'react';
import { User, UserRole, WorkLog, WorkLogStatus, KioskState, KioskSession, KioskShift } from '../types';

// ─── Mock auth ───────────────────────────────────────────────────────────────
// Temporary: every user's password = their carnet (students) or employee number (staff).
// Replace this function body with a real Supabase auth call when backend is ready.
function mockValidateCredentials(
  identifier: string,
  password: string,
  allUsers: User[],
): User | null {
  const user = allUsers.find(u => {
    const id = (u.carnet ?? u.employeeNumber ?? u.id).toLowerCase();
    return id === identifier.toLowerCase();
  });
  if (!user) return null;
  // Mock password: same as identifier (carnet or employee number)
  const expectedPassword = (user.carnet ?? user.employeeNumber ?? user.id).toLowerCase();
  return password.toLowerCase() === expectedPassword ? user : null;
}

// ─── Shift helpers ────────────────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function isWithinShift(shifts: KioskShift[]): boolean {
  if (shifts.length === 0) return false;
  const current = nowMinutes();
  return shifts.some(s => {
    const start = timeToMinutes(s.startTime);
    const end   = timeToMinutes(s.endTime);
    return current >= start && current < end;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Machine-readable result codes so the UI can surface specific messages/styles.
 *
 * WRONG_DEPT    — credentials are valid but the user belongs to a different department.
 *                 Treat as a security warning, not just a generic error.
 * BAD_CREDS     — identifier not found or password mismatch.
 * ALREADY_ACTIVE— a kiosk is already running (only one allowed per department at a time).
 * ALREADY_IN    — student tried to clock in but already has an active session.
 * NOT_IN        — student tried to clock out but has no active session.
 * NOT_FOUND     — session or entity not found.
 *
 * When Supabase is live these codes map 1-to-1 to server error codes.
 */
export type KioskResultCode =
  | 'WRONG_DEPT'
  | 'BAD_CREDS'
  | 'ALREADY_ACTIVE'
  | 'ALREADY_IN'
  | 'NOT_IN'
  | 'NOT_FOUND';

export interface KioskActionResult {
  ok: boolean;
  /** Human-readable message for the UI to display. */
  error?: string;
  /** Machine-readable code — lets UI apply specific styles/sounds. */
  code?: KioskResultCode;
  /** On successful clock-in, the student's display name for the success toast. */
  name?: string;
}

export interface KioskActions {
  /** Dept head or super admin activates kiosk for their department. */
  activate: (identifier: string, password: string, targetDepartmentId?: string) => KioskActionResult;
  /** Dept head or super admin deactivates kiosk. Requires auth. */
  deactivate: (identifier: string, password: string) => KioskActionResult;
  /** Student clocks in. Requires their own credentials. Returns name on success. */
  clockIn: (identifier: string, password: string) => KioskActionResult;
  /** Student clocks out. Requires their own credentials. */
  clockOut: (identifier: string, password: string) => KioskActionResult;
  /** Dept head cancels a student session with a reason. Requires dept head credentials. */
  cancelSession: (
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ) => KioskActionResult;
  /** Update the scheduled shift windows. Requires dept head credentials. */
  updateShifts: (
    identifier: string,
    password: string,
    shifts: KioskShift[],
  ) => KioskActionResult;
}

interface UseKioskOptions {
  allUsers: User[];
  addWorkLog: (data: Omit<WorkLog, 'id' | 'status'>, status?: WorkLogStatus) => void;
  /** Pre-activate kiosk for a specific department (used by super admin remote enable). */
  initialDepartmentId?: string;
}

interface UseKioskReturn {
  kiosk: KioskState | null;
  activeSessions: (KioskSession & { user: User })[];
  isWithinScheduledShift: boolean;
  actions: KioskActions;
}

export function useKiosk({ allUsers, addWorkLog, initialDepartmentId }: UseKioskOptions): UseKioskReturn {
  const [kiosk, setKiosk] = useState<KioskState | null>(null);
  const [tick, setTick]   = useState(0);

  // Re-evaluate shift windows every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-activate via scheduled shifts when initialDepartmentId is set
  useEffect(() => {
    if (!initialDepartmentId || kiosk) return;
    // This effect would subscribe to Supabase Realtime in production.
    // For now, shifts auto-activate only when configured via updateShifts.
  }, [initialDepartmentId, kiosk]);

  const canManageKiosk = useCallback((user: User, departmentId: string): boolean => {
    if (user.role === UserRole.SUPER_ADMIN) return true;
    if (user.role === UserRole.DEPT_HEAD && user.departmentId === departmentId) return true;
    return false;
  }, []);

  const activate = useCallback((identifier: string, password: string, targetDepartmentId?: string): KioskActionResult => {
    // Block a second kiosk from ever being opened in the same app session.
    // On Supabase: the UNIQUE(department_id) constraint on kiosk_state enforces this server-side.
    if (kiosk) {
      return {
        ok: false,
        error: 'Ya hay un kiosco activo. Solo puede haber uno a la vez — desactívalo primero.',
        code: 'ALREADY_ACTIVE',
      };
    }

    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };

    const departmentId =
      user.role === UserRole.SUPER_ADMIN
        ? (targetDepartmentId?.trim() || user.departmentId)
        : user.departmentId;

    if (!departmentId && user.role !== UserRole.SUPER_ADMIN) {
      return { ok: false, error: 'No tienes un departamento asignado.', code: 'NOT_FOUND' };
    }
    if (user.role === UserRole.SUPER_ADMIN && !departmentId) {
      return { ok: false, error: 'Debes indicar el ID del departamento objetivo.', code: 'NOT_FOUND' };
    }

    const targetDept = departmentId ?? '';
    if (!canManageKiosk(user, targetDept)) {
      return {
        ok: false,
        error: 'No tienes permisos para activar el kiosco en este departamento.',
        code: 'WRONG_DEPT',
      };
    }

    setKiosk({
      departmentId: targetDept,
      activatedBy: user.id,
      activatedAt: new Date().toISOString(),
      sessions: [],
      shifts: [],
    });
    return { ok: true };
  }, [allUsers, canManageKiosk, kiosk]);

  const deactivate = useCallback((identifier: string, password: string): KioskActionResult => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };
    if (!canManageKiosk(user, kiosk.departmentId)) {
      return {
        ok: false,
        error: 'No tienes permisos para desactivar el kiosco en este departamento.',
        code: 'WRONG_DEPT',
      };
    }

    // Flush all open sessions as approved work logs before closing
    kiosk.sessions.forEach(session => {
      const student = allUsers.find(u => u.id === session.studentId);
      if (!student) return;
      const closedAtIso = new Date().toISOString();
      const hoursWorked = parseFloat(
        ((new Date(closedAtIso).getTime() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
      );
      addWorkLog(
        {
          studentId: session.studentId,
          departmentId: kiosk.departmentId,
          date: closedAtIso.split('T')[0],
          hours: hoursWorked,
          description: 'Sesión kiosco — cierre automático al desactivar',
          entrySource: 'KIOSK',
          startTime: session.startedAt,
          endTime: closedAtIso,
        },
        WorkLogStatus.PENDING,
      );
    });

    setKiosk(null);
    return { ok: true };
  }, [kiosk, allUsers, canManageKiosk, addWorkLog]);

  const clockIn = useCallback((identifier: string, password: string): KioskActionResult => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };
    if (user.role !== UserRole.STUDENT) {
      return { ok: false, error: 'Solo los estudiantes pueden registrar entrada.', code: 'BAD_CREDS' };
    }
    if (user.departmentId !== kiosk.departmentId) {
      return {
        ok: false,
        error: 'Este carnet pertenece a otro departamento. Acceso denegado.',
        code: 'WRONG_DEPT',
      };
    }
    if (kiosk.sessions.some(s => s.studentId === user.id)) {
      return {
        ok: false,
        error: 'Ya tienes una sesión activa. Ingresa tu carnet nuevamente para registrar tu salida.',
        code: 'ALREADY_IN',
      };
    }

    setKiosk(prev => prev ? {
      ...prev,
      sessions: [...prev.sessions, { studentId: user.id, startedAt: new Date().toISOString() }],
    } : prev);
    return { ok: true, name: user.name };
  }, [kiosk, allUsers]);

  const clockOut = useCallback((identifier: string, password: string): KioskActionResult => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };
    if (user.departmentId !== kiosk.departmentId) {
      return {
        ok: false,
        error: 'Este carnet pertenece a otro departamento. Acceso denegado.',
        code: 'WRONG_DEPT',
      };
    }

    const session = kiosk.sessions.find(s => s.studentId === user.id);
    if (!session) return { ok: false, error: 'No tienes una sesión activa en este kiosco.', code: 'NOT_IN' };

    const endedAtIso = new Date().toISOString();
    const hoursWorked = parseFloat(
      ((new Date(endedAtIso).getTime() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
    );

    setKiosk(prev => prev ? {
      ...prev,
      sessions: prev.sessions.filter(s => s.studentId !== user.id),
    } : prev);

    addWorkLog(
      {
        studentId: user.id,
        departmentId: kiosk.departmentId,
        date: endedAtIso.split('T')[0],
        hours: Math.max(hoursWorked, 0),
        description: 'Sesión kiosco',
        entrySource: 'KIOSK',
        startTime: session.startedAt,
        endTime: endedAtIso,
      },
      WorkLogStatus.PENDING,
    );
    return { ok: true, name: user.name };
  }, [kiosk, allUsers, addWorkLog]);

  const cancelSession = useCallback((
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ): KioskActionResult => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    if (!reason.trim()) return { ok: false, error: 'Debes ingresar una razón.' };

    const head = mockValidateCredentials(headIdentifier, headPassword, allUsers);
    if (!head) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };
    if (!canManageKiosk(head, kiosk.departmentId)) {
      return {
        ok: false,
        error: 'No tienes permisos para cancelar sesiones en este departamento.',
        code: 'WRONG_DEPT',
      };
    }

    const session = kiosk.sessions.find(s => s.studentId === studentId);
    if (!session) return { ok: false, error: 'Sesión no encontrada.', code: 'NOT_FOUND' };

    // Save a REJECTED log — this surfaces in student history AND dept head dashboard.
    // rejectionReason is stored so both portals can display why it was cancelled.
    const rejectedAtIso = new Date().toISOString();
    const hoursWorked = parseFloat(
      ((new Date(rejectedAtIso).getTime() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
    );
    // Always create the log (even < 0.05h) so the student sees the rejection.
    addWorkLog(
      {
        studentId: session.studentId,
        departmentId: kiosk.departmentId,
        date: rejectedAtIso.split('T')[0],
        hours: Math.max(hoursWorked, 0),
        description: 'Sesión kiosco — cancelada por jefe de departamento',
        entrySource: 'KIOSK',
        startTime: session.startedAt,
        endTime: rejectedAtIso,
        rejectionReason: reason,
      },
      WorkLogStatus.REJECTED,
    );

    setKiosk(prev => prev ? {
      ...prev,
      sessions: prev.sessions.filter(s => s.studentId !== studentId),
    } : prev);
    return { ok: true };
  }, [kiosk, allUsers, canManageKiosk, addWorkLog]);

  const updateShifts = useCallback((
    identifier: string,
    password: string,
    shifts: KioskShift[],
  ): KioskActionResult => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.', code: 'BAD_CREDS' };
    if (!canManageKiosk(user, kiosk.departmentId)) {
      return {
        ok: false,
        error: 'No tienes permisos para configurar turnos en este departamento.',
        code: 'WRONG_DEPT',
      };
    }
    setKiosk(prev => prev ? { ...prev, shifts } : prev);
    return { ok: true };
  }, [kiosk, allUsers, canManageKiosk]);

  const activeSessions = (kiosk?.sessions ?? []).map(s => ({
    ...s,
    user: allUsers.find(u => u.id === s.studentId)!,
  })).filter(s => s.user);

  // Re-evaluate on every tick so the shift indicator stays current
  void tick;
  const isWithinScheduledShift = kiosk ? isWithinShift(kiosk.shifts) : false;

  return {
    kiosk,
    activeSessions,
    isWithinScheduledShift,
    actions: { activate, deactivate, clockIn, clockOut, cancelSession, updateShifts },
  };
}
