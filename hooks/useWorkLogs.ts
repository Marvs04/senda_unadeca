import { useState } from 'react';
import { WorkLog, WorkLogStatus } from '../types';
import { MOCK_WORK_LOGS } from '../constants';

export function useWorkLogs() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>(MOCK_WORK_LOGS);

  const addWorkLog = (newLogData: Omit<WorkLog, 'id' | 'status'>, status: WorkLogStatus = WorkLogStatus.PENDING) => {
    const newLog: WorkLog = {
      ...newLogData,
      id: `log-${Date.now()}-${Math.random()}`,
      status,
    };
    setWorkLogs(prev =>
      [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  };

  const updateWorkLogStatus = (logId: string, newStatus: WorkLogStatus, reason?: string) => {
    setWorkLogs(prev =>
      prev.map(log => log.id === logId ? { ...log, status: newStatus, rejectionReason: reason } : log)
    );
  };

  const updateMultipleWorkLogsStatus = (updates: { logId: string; status: WorkLogStatus }[]) => {
    setWorkLogs(prev => {
      const updatesMap = new Map(updates.map(u => [u.logId, u.status]));
      return prev.map(log => updatesMap.has(log.id) ? { ...log, status: updatesMap.get(log.id)! } : log);
    });
  };

  return { workLogs, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus };
}
