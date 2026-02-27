/**
 * hooks/useWorkLogs.ts
 *
 * Gestiona el estado de los registros de horas.
 *
 * Ciclo de vida:
 *   isLoading=true  → getWorkLogs() → isLoading=false + workLogs | error
 *
 * Las mutaciones (add / update) son optimistas: actualizan el estado local
 * de inmediato. Cuando el backend esté listo, agregar el await al servicio
 * correspondiente antes de setWorkLogs().
 */
import { useState, useEffect } from 'react';
import { WorkLog, WorkLogStatus } from '../types';
import { getWorkLogs } from '../services';

export function useWorkLogs() {
  const [workLogs, setWorkLogs]   = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getWorkLogs()
      .then(data => {
        if (!cancelled) {
          setWorkLogs(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar registros de horas');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ── Mutaciones optimistas ─────────────────────────────────────────────────

  const addWorkLog = (
    newLogData: Omit<WorkLog, 'id' | 'status'>,
    status: WorkLogStatus = WorkLogStatus.PENDING,
  ) => {
    const newLog: WorkLog = {
      ...newLogData,
      id: `log-${Date.now()}-${Math.random()}`,
      status,
    };
    setWorkLogs(prev =>
      [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );
  };

  const updateWorkLogStatus = (logId: string, newStatus: WorkLogStatus, reason?: string) => {
    setWorkLogs(prev =>
      prev.map(log =>
        log.id === logId ? { ...log, status: newStatus, rejectionReason: reason } : log,
      ),
    );
  };

  const updateMultipleWorkLogsStatus = (updates: { logId: string; status: WorkLogStatus }[]) => {
    setWorkLogs(prev => {
      const map = new Map(updates.map(u => [u.logId, u.status]));
      return prev.map(log => map.has(log.id) ? { ...log, status: map.get(log.id)! } : log);
    });
  };

  return { workLogs, isLoading, error, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus };
}
