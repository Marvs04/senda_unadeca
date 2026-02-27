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

export interface KioskActions {
  /** Dept head or super admin activates kiosk for their department. */
  activate: (identifier: string, password: string) => { ok: boolean; error?: string };
  /** Dept head or super admin deactivates kiosk. Requires auth. */
  deactivate: (identifier: string, password: string) => { ok: boolean; error?: string };
  /** Student clocks in. Requires their own credentials. */
  clockIn: (identifier: string, password: string) => { ok: boolean; error?: string };
  /** Student clocks out. Requires their own credentials. */
  clockOut: (identifier: string, password: string) => { ok: boolean; error?: string };
  /** Dept head cancels a student session with a reason. Requires dept head credentials. */
  cancelSession: (
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ) => { ok: boolean; error?: string };
  /** Update the scheduled shift windows. Requires dept head credentials. */
  updateShifts: (
    identifier: string,
    password: string,
    shifts: KioskShift[],
  ) => { ok: boolean; error?: string };
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

  const activate = useCallback((identifier: string, password: string): { ok: boolean; error?: string } => {
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.' };

    const departmentId = user.departmentId;
    if (!departmentId && user.role !== UserRole.SUPER_ADMIN) {
      return { ok: false, error: 'No tienes un departamento asignado.' };
    }
    // Super admin must have a target dept — handled by the UI passing a selected dept
    const targetDept = departmentId ?? '';
    if (!canManageKiosk(user, targetDept)) {
      return { ok: false, error: 'No tienes permisos para activar el kiosco en este departamento.' };
    }
    if (kiosk) return { ok: false, error: 'El kiosco ya está activo.' };

    setKiosk({
      departmentId: targetDept,
      activatedBy: user.id,
      activatedAt: new Date().toISOString(),
      sessions: [],
      shifts: [],
    });
    return { ok: true };
  }, [allUsers, canManageKiosk, kiosk]);

  const deactivate = useCallback((identifier: string, password: string): { ok: boolean; error?: string } => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.' };
    if (!canManageKiosk(user, kiosk.departmentId)) {
      return { ok: false, error: 'No tienes permisos para desactivar el kiosco.' };
    }

    // Flush all open sessions as approved work logs before closing
    kiosk.sessions.forEach(session => {
      const student = allUsers.find(u => u.id === session.studentId);
      if (!student) return;
      const hoursWorked = parseFloat(
        ((Date.now() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
      );
      if (hoursWorked < 0.05) return; // ignore ghost sessions < 3 min
      addWorkLog(
        {
          studentId: session.studentId,
          departmentId: kiosk.departmentId,
          date: new Date().toISOString().split('T')[0],
          hours: hoursWorked,
          description: 'Sesión kiosco — cierre automático al desactivar',
        },
        WorkLogStatus.PENDING,
      );
    });

    setKiosk(null);
    return { ok: true };
  }, [kiosk, allUsers, canManageKiosk, addWorkLog]);

  const clockIn = useCallback((identifier: string, password: string): { ok: boolean; error?: string } => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.' };
    if (user.role !== UserRole.STUDENT) return { ok: false, error: 'Solo los estudiantes pueden registrar entrada.' };
    if (user.departmentId !== kiosk.departmentId) {
      return { ok: false, error: 'No perteneces a este departamento.' };
    }
    if (kiosk.sessions.some(s => s.studentId === user.id)) {
      return { ok: false, error: 'Ya tienes una sesión activa. Ingresa tu carnet nuevamente para salir.' };
    }

    setKiosk(prev => prev ? {
      ...prev,
      sessions: [...prev.sessions, { studentId: user.id, startedAt: new Date().toISOString() }],
    } : prev);
    return { ok: true };
  }, [kiosk, allUsers]);

  const clockOut = useCallback((identifier: string, password: string): { ok: boolean; error?: string } => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.' };

    const session = kiosk.sessions.find(s => s.studentId === user.id);
    if (!session) return { ok: false, error: 'No tienes una sesión activa.' };

    const hoursWorked = parseFloat(
      ((Date.now() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
    );

    setKiosk(prev => prev ? {
      ...prev,
      sessions: prev.sessions.filter(s => s.studentId !== user.id),
    } : prev);

    if (hoursWorked >= 0.05) {
      addWorkLog(
        {
          studentId: user.id,
          departmentId: kiosk.departmentId,
          date: new Date().toISOString().split('T')[0],
          hours: hoursWorked,
          description: 'Sesión kiosco',
        },
        WorkLogStatus.PENDING,
      );
    }
    return { ok: true };
  }, [kiosk, allUsers, addWorkLog]);

  const cancelSession = useCallback((
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ): { ok: boolean; error?: string } => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.' };
    if (!reason.trim()) return { ok: false, error: 'Debes ingresar una razón.' };

    const head = mockValidateCredentials(headIdentifier, headPassword, allUsers);
    if (!head) return { ok: false, error: 'Credenciales incorrectas.' };
    if (!canManageKiosk(head, kiosk.departmentId)) {
      return { ok: false, error: 'No tienes permisos para cancelar sesiones.' };
    }

    const session = kiosk.sessions.find(s => s.studentId === studentId);
    if (!session) return { ok: false, error: 'Sesión no encontrada.' };

    // Save a rejected log so the cancellation is recorded
    const hoursWorked = parseFloat(
      ((Date.now() - new Date(session.startedAt).getTime()) / 3_600_000).toFixed(2),
    );
    if (hoursWorked >= 0.05) {
      addWorkLog(
        {
          studentId: session.studentId,
          departmentId: kiosk.departmentId,
          date: new Date().toISOString().split('T')[0],
          hours: hoursWorked,
          description: 'Sesión kiosco — cancelada por jefe de departamento',
        },
        WorkLogStatus.REJECTED,
      );
    }

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
  ): { ok: boolean; error?: string } => {
    if (!kiosk) return { ok: false, error: 'El kiosco no está activo.' };
    const user = mockValidateCredentials(identifier, password, allUsers);
    if (!user) return { ok: false, error: 'Credenciales incorrectas.' };
    if (!canManageKiosk(user, kiosk.departmentId)) {
      return { ok: false, error: 'No tienes permisos para configurar turnos.' };
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
