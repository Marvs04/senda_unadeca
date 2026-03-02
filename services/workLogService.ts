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
import { MOCK_WORK_LOGS } from '../api/__mocks__';
// import { apiClient } from '../api';
// import { supabase, TABLES, mapWorkLog } from '../api'; // ← Supabase

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getWorkLogs(): Promise<WorkLog[]> {
  // Real (REST):
  // const { data } = await apiClient.get<WorkLog[]>('/work-logs');
  // return data;

  // Real (Supabase):
  // const { data, error } = await supabase
  //   .from(TABLES.WORK_LOGS)
  //   .select('*')
  //   .order('date', { ascending: false });
  // if (error) throw new Error(error.message);
  // return data.map(mapWorkLog);

  return Promise.resolve(
    [...MOCK_WORK_LOGS].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  );
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createWorkLog(
  data: Omit<WorkLog, 'id' | 'status'>,
  status: WorkLogStatus = WorkLogStatus.PENDING,
): Promise<WorkLog> {
  const newLog: WorkLog = {
    ...data,
    id: crypto.randomUUID(),
    status,
  };

  // Real (REST):
  // const { data: created } = await apiClient.post<WorkLog>('/work-logs', { ...data, status });
  // return created;

  // Real (Supabase):
  // const row = { student_id: data.studentId, department_id: data.departmentId,
  //               date: data.date, hours: data.hours, description: data.description, status };
  // const { data: created, error } = await supabase.from(TABLES.WORK_LOGS).insert(row).select().single();
  // if (error) throw new Error(error.message);
  // return mapWorkLog(created);

  return Promise.resolve(newLog);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function patchWorkLogStatus(
  logId: string,
  status: WorkLogStatus,
  rejectionReason?: string,
): Promise<{ logId: string; status: WorkLogStatus; rejectionReason?: string }> {
  // Real (REST):
  // const { data } = await apiClient.patch(`/work-logs/${logId}/status`, { status, rejectionReason });
  // return data as { logId: string; status: WorkLogStatus; rejectionReason?: string };

  // Real (Supabase):
  // const { error } = await supabase
  //   .from(TABLES.WORK_LOGS)
  //   .update({ status, rejection_reason: rejectionReason ?? null })
  //   .eq('id', logId);
  // if (error) throw new Error(error.message);
  // return { logId, status, rejectionReason };

  return Promise.resolve({ logId, status, rejectionReason });
}

export async function bulkPatchWorkLogStatus(
  _updates: { logId: string; status: WorkLogStatus }[],
): Promise<void> {
  // Real (REST):
  // await apiClient.patch('/work-logs/bulk-status', { updates });

  // Real (Supabase):
  // await Promise.all(
  //   updates.map(({ logId, status }) =>
  //     supabase.from(TABLES.WORK_LOGS).update({ status }).eq('id', logId)
  //   )
  // );

  return Promise.resolve();
}
