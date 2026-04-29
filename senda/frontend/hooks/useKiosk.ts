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
 * Validation is done server-side (Supabase signInWithPassword via /api/v1/kiosk).
 *
 * KioskState is stored in memory only (no localStorage).
 * Remote activation by super admin requires Supabase Realtime (see BACKEND_SPEC §D.9).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, KioskState, KioskSession, KioskShift } from '../types';
import { getCostaRicaMinutesNow } from '../lib/utils';
import * as kioskApi from '../services/kioskService';
import { subscribeToTableChanges } from '../lib/realtime';
import { ApiError } from '../api/apiClient';

// ─── Shift helpers ─────────────────────────────────────────────────────────────
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function isWithinShift(shifts: KioskShift[]): boolean {
  if (shifts.length === 0) return false;
  const current = getCostaRicaMinutesNow();
  return shifts.some(s => {
    const start = timeToMinutes(s.startTime);
    const end   = timeToMinutes(s.endTime);
    return current >= start && current < end;
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * WRONG_DEPT    — identifier belongs to a different department.
 *                 Treat as a security warning, not just a generic error.
 * BAD_CREDS     — identifier not found or password mismatch.
 * ALREADY_ACTIVE— a kiosk is already running (only one allowed per department at a time).
 * ALREADY_IN    — student tried to clock in but already has an active session.
 * NOT_IN        — student tried to clock out but has no active session.
 * NOT_FOUND     — session or entity not found.
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
  /** On successful clock-in/out, the student's display name for the success toast. */
  name?: string;
}

export interface KioskActions {
  activate(identifier: string, password: string, targetDepartmentId?: string): Promise<KioskActionResult>;
  continueExisting(identifier: string, password: string, targetDepartmentId?: string): Promise<KioskActionResult>;
  deactivate(identifier: string, password: string): Promise<KioskActionResult>;
  clockIn(identifier: string, password: string): Promise<KioskActionResult>;
  clockOut(identifier: string, password: string): Promise<KioskActionResult>;
  cancelSession(
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ): Promise<KioskActionResult>;
  updateShifts(identifier: string, password: string, shifts: KioskShift[]): Promise<KioskActionResult>;
}

interface UseKioskOptions {
  /** Pre-activate kiosk for a specific department (remote activation by super admin). */
  initialDepartmentId?: string;
}

interface UseKioskReturn {
  kiosk: KioskState | null;
  activeSessions: (KioskSession & { user: User })[];
  isWithinScheduledShift: boolean;
  actions: KioskActions;
}

// ─── Map API response → KioskState ────────────────────────────────────────────
function mapApiState(apiState: kioskApi.KioskStateApi): KioskState {
  return {
    departmentId: apiState.departmentId,
    activatedBy: apiState.activatedBy,
    activatedAt: apiState.activatedAt,
    shifts: apiState.shifts,
    sessions: apiState.sessions.map(s => ({
      studentId: s.studentId,
      startedAt: s.startedAt,
    })),
  };
}

function mapActiveSessions(
  apiState: kioskApi.KioskStateApi,
): (KioskSession & { user: User })[] {
  return apiState.sessions
    .filter(s => s.user !== null)
    .map(s => ({
      studentId: s.studentId,
      startedAt: s.startedAt,
      user: {
        id: s.user!.id,
        name: s.user!.name,
        role: s.user!.role as UserRole,
        carnet: s.user!.carnet,
        departmentId: s.user!.departmentId,
        isActive: true,
      } as User,
    }));
}

// ─── Error normalizer ──────────────────────────────────────────────────────────
function toKioskResult(error: unknown): KioskActionResult {
  if (error instanceof ApiError) {
    let code: KioskResultCode | undefined;
    if (error.status === 401)      code = 'BAD_CREDS';
    else if (error.status === 403) code = 'WRONG_DEPT';
    else if (error.status === 404) code = 'NOT_FOUND';
    else if (error.status === 409) code = 'ALREADY_ACTIVE';
    return { ok: false, error: error.message, code };
  }
  const msg = error instanceof Error ? error.message : 'Error desconocido.';
  return { ok: false, error: msg };
}

const KIOSK_DEPT_KEY = 'senda_kiosk_dept';

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useKiosk({ initialDepartmentId }: UseKioskOptions = {}): UseKioskReturn {
  const [apiState, setApiState] = useState<kioskApi.KioskStateApi | null>(null);
  const [tick, setTick]         = useState(0);

  // Re-evaluate shift windows every minute
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Restore kiosk from localStorage on page refresh
  useEffect(() => {
    const savedDeptId = initialDepartmentId || localStorage.getItem(KIOSK_DEPT_KEY);
    if (!savedDeptId || apiState) return;
    kioskApi.getKioskState(savedDeptId)
      .then(state => { if (state) setApiState(state); })
      .catch(() => { /* kiosk not active or network error — silently ignore */ });
  }, [initialDepartmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a ref to the active department for the realtime callback
  const deptRef = useRef<string | null>(null);
  useEffect(() => { deptRef.current = apiState?.departmentId ?? null; });

  // Realtime: refresh when kiosk_sessions or kiosk_state change (250 ms debounce)
  useEffect(() => {
    let refreshTimer: number | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        const dept = deptRef.current;
        if (!dept) return;
        kioskApi.getKioskState(dept)
          .then(state => setApiState(state))
          .catch(err => console.warn('[Kiosk Realtime] refresh fallido', err));
      }, 250);
    };

    const unsub1 = subscribeToTableChanges({ table: 'kiosk_sessions', onChange: scheduleRefresh });
    const unsub2 = subscribeToTableChanges({ table: 'kiosk_state',    onChange: scheduleRefresh });

    return () => {
      unsub1();
      unsub2();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, []);  

  // ─── Actions ────────────────────────────────────────────────────────────────

  const activate = useCallback(async (
    identifier: string,
    password: string,
    targetDepartmentId?: string,
  ): Promise<KioskActionResult> => {
    if (apiState) {
      return { ok: false, error: 'Ya hay un kiosco activo. Desactívalo primero.', code: 'ALREADY_ACTIVE' };
    }
    try {
      const state = await kioskApi.activateKiosk(identifier, password, targetDepartmentId);
      setApiState(state);
      localStorage.setItem(KIOSK_DEPT_KEY, state.departmentId);
      return { ok: true };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  const continueExisting = useCallback(async (
    identifier: string,
    password: string,
    targetDepartmentId?: string,
  ): Promise<KioskActionResult> => {
    try {
      const state = await kioskApi.continueKiosk(identifier, password, targetDepartmentId);
      setApiState(state);
      localStorage.setItem(KIOSK_DEPT_KEY, state.departmentId);
      return { ok: true };
    } catch (err) {
      return toKioskResult(err);
    }
  }, []);

  const deactivate = useCallback(async (
    identifier: string,
    password: string,
  ): Promise<KioskActionResult> => {
    if (!apiState) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    try {
      await kioskApi.deactivateKiosk(identifier, password, apiState.departmentId);
      setApiState(null);
      localStorage.removeItem(KIOSK_DEPT_KEY);
      return { ok: true };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  const clockIn = useCallback(async (
    identifier: string,
    password: string,
  ): Promise<KioskActionResult> => {
    if (!apiState) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    try {
      const result = await kioskApi.clockIn(identifier, password);
      const freshState = await kioskApi.getKioskState(apiState.departmentId);
      if (freshState) setApiState(freshState);
      return { ok: true, name: result.name };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  const clockOut = useCallback(async (
    identifier: string,
    password: string,
  ): Promise<KioskActionResult> => {
    if (!apiState) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    try {
      const result = await kioskApi.clockOut(identifier, password);
      const freshState = await kioskApi.getKioskState(apiState.departmentId);
      if (freshState) setApiState(freshState);
      return { ok: true, name: result.name };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  const cancelSession = useCallback(async (
    headIdentifier: string,
    headPassword: string,
    studentId: string,
    reason: string,
  ): Promise<KioskActionResult> => {
    if (!apiState) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    if (!reason.trim()) return { ok: false, error: 'Debes ingresar una razón.' };
    try {
      await kioskApi.cancelSession(headIdentifier, headPassword, studentId, reason);
      const freshState = await kioskApi.getKioskState(apiState.departmentId);
      if (freshState) setApiState(freshState);
      return { ok: true };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  const updateShifts = useCallback(async (
    identifier: string,
    password: string,
    shifts: KioskShift[],
  ): Promise<KioskActionResult> => {
    if (!apiState) return { ok: false, error: 'El kiosco no está activo.', code: 'NOT_FOUND' };
    try {
      const result = await kioskApi.updateShifts(identifier, password, shifts);
      setApiState(prev => prev ? { ...prev, shifts: result.shifts } : prev);
      return { ok: true };
    } catch (err) {
      return toKioskResult(err);
    }
  }, [apiState]);

  // ─── Derived values ──────────────────────────────────────────────────────────

  const kiosk = apiState ? mapApiState(apiState) : null;
  const activeSessions = apiState ? mapActiveSessions(apiState) : [];

  void tick; // re-evaluate shift windows on tick
  const isWithinScheduledShift = kiosk ? isWithinShift(kiosk.shifts) : false;

  return {
    kiosk,
    activeSessions,
    isWithinScheduledShift,
    actions: { activate, continueExisting, deactivate, clockIn, clockOut, cancelSession, updateShifts },
  };
}

