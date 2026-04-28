/**
 * services/kioskService.ts
 *
 * API calls for the kiosk feature (REST endpoints on /api/v1/kiosk).
 */

import { apiClient } from '../api';
import { KioskShift, WorkLog } from '../types';

// ─── API response types ───────────────────────────────────────────────────────

export interface KioskSessionApi {
  studentId: string;
  startedAt: string;
  sessionId: string;
  user: { id: string; name: string; role: string; carnet?: string; departmentId?: string } | null;
}

export interface KioskStateApi {
  id: string;
  departmentId: string;
  activatedBy: string;
  activatedAt: string;
  shifts: KioskShift[];
  sessions: KioskSessionApi[];
}

export interface ClockInResult {
  ok: true;
  name: string;
  sessionId: string;
  startedAt: string;
}

export interface ClockOutResult {
  ok: true;
  name: string;
  workLog: WorkLog;
}

export interface CancelSessionResult {
  ok: true;
  workLog: WorkLog;
}

export interface DeactivateResult {
  ok: true;
  flushedSessions: number;
}

export interface UpdateShiftsResult {
  ok: true;
  shifts: KioskShift[];
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getKioskState(departmentId: string): Promise<KioskStateApi | null> {
  const { data } = await apiClient.get<KioskStateApi | null>(`/kiosk/${departmentId}`);
  return data;
}

export async function activateKiosk(
  identifier: string,
  password: string,
  departmentId?: string,
): Promise<KioskStateApi> {
  const { data } = await apiClient.post<KioskStateApi>('/kiosk/activate', {
    identifier,
    password,
    ...(departmentId ? { departmentId } : {}),
  });
  return data;
}

export async function deactivateKiosk(
  identifier: string,
  password: string,
  departmentId?: string,
): Promise<DeactivateResult> {
  const { data } = await apiClient.post<DeactivateResult>('/kiosk/deactivate', {
    identifier,
    password,
    ...(departmentId ? { departmentId } : {}),
  });
  return data;
}

export async function clockIn(
  identifier: string,
  password: string,
): Promise<ClockInResult> {
  const { data } = await apiClient.post<ClockInResult>('/kiosk/clock-in', {
    identifier,
    password,
  });
  return data;
}

export async function clockOut(
  identifier: string,
  password: string,
): Promise<ClockOutResult> {
  const { data } = await apiClient.post<ClockOutResult>('/kiosk/clock-out', {
    identifier,
    password,
  });
  return data;
}

export async function cancelSession(
  identifier: string,
  password: string,
  studentId: string,
  reason: string,
): Promise<CancelSessionResult> {
  const { data } = await apiClient.post<CancelSessionResult>('/kiosk/cancel-session', {
    identifier,
    password,
    studentId,
    reason,
  });
  return data;
}

export async function updateShifts(
  identifier: string,
  password: string,
  shifts: KioskShift[],
): Promise<UpdateShiftsResult> {
  const { data } = await apiClient.patch<UpdateShiftsResult>('/kiosk/shifts', {
    identifier,
    password,
    shifts,
  });
  return data;
}
