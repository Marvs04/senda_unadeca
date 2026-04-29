import { apiClient } from './index';

export interface SessionLock {
  id: string;
  departmentId: string;
  startDatetime: string;
  endDatetime: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface LockCheckResponse {
  isLocked: boolean;
  reason?: string;
}

export async function getLocks(departmentId: string): Promise<SessionLock[]> {
  const { data } = await apiClient.get(`/session-locks/${departmentId}`);
  return data;
}

export async function checkIsLocked(departmentId: string): Promise<LockCheckResponse> {
  const { data } = await apiClient.get(`/session-locks/${departmentId}/check`);
  return data;
}

export async function createLock(
  departmentId: string,
  startDateTime: string,
  endDateTime: string,
  reason?: string,
): Promise<SessionLock> {
  const { data } = await apiClient.post(`/session-locks/${departmentId}`, {
    startDateTime,
    endDateTime,
    reason,
  });
  return data;
}

export async function deleteLock(lockId: string): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete(`/session-locks/${lockId}`);
  return data;
}
