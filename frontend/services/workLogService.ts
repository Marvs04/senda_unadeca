/**
 * services/workLogService.ts
 *
 * Data-access layer for WorkLog resources.
 * Each function wraps mock data today and documents the real fetch call
 * that replaces it when a backend is available.
 *
 * Swap: uncomment the real fetch block and delete the mock return below it.
 */

import { WorkLog, WorkLogStatus } from '../types';
import { apiClient } from '../api';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getWorkLogs(): Promise<WorkLog[]> {
  const { data } = await apiClient.get<WorkLog[]>('/work-logs');
  return data;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createWorkLog(
  data: Omit<WorkLog, 'id' | 'status'>,
  status: WorkLogStatus = WorkLogStatus.PENDING,
): Promise<WorkLog> {
  const { data: created } = await apiClient.post<WorkLog>('/work-logs', {
    studentId: data.studentId,
    departmentId: data.departmentId,
    date: data.date,
    hours: data.hours,
    description: data.description,
    status,
    rejectionReason: data.rejectionReason,
  });

  return created;
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function patchWorkLogStatus(
  logId: string,
  status: WorkLogStatus,
  rejectionReason?: string,
): Promise<{ logId: string; status: WorkLogStatus; rejectionReason?: string }> {
  await apiClient.patch(`/work-logs/${logId}/status`, {
    status,
    rejectionReason,
  });
  return { logId, status, rejectionReason };
}

export async function bulkPatchWorkLogStatus(
  updates: { logId: string; status: WorkLogStatus }[],
): Promise<void> {
  await apiClient.patch('/work-logs/bulk-status', { updates });
}
