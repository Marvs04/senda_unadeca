import { apiClient } from '../api';

export interface ActiveTimerSession {
  id: string;
  studentId: string;
  departmentId: string;
  startedAt: string;
  description: string;
  status: 'ACTIVE' | 'STOPPED_BY_HEAD';
  student?: { id: string; name: string; carnet?: string | null } | null;
}

export async function startSession(departmentId: string, description: string): Promise<ActiveTimerSession> {
  const { data } = await apiClient.post<ActiveTimerSession>('/active-sessions', { departmentId, description });
  return data;
}

export async function endSession(): Promise<void> {
  await apiClient.del('/active-sessions');
}

export async function getActiveSessions(departmentId: string): Promise<ActiveTimerSession[]> {
  const { data } = await apiClient.get<ActiveTimerSession[]>(`/active-sessions/dept/${departmentId}`);
  return data;
}

export async function stopSession(sessionId: string, departmentId: string, reason: string): Promise<void> {
  await apiClient.post(`/active-sessions/${sessionId}/stop`, { departmentId, reason });
}
