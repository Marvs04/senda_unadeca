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
import { useState, useEffect, useCallback } from 'react';
import { WorkLog, WorkLogStatus } from '../types';
import { getWorkLogs, createWorkLog, patchWorkLogStatus } from '../services';
import { toast } from 'sonner';

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

  const addWorkLog = useCallback((
    newLogData: Omit<WorkLog, 'id' | 'status'>,
    status: WorkLogStatus = WorkLogStatus.PENDING,
  ) => {
    const newLog: WorkLog = {
      ...newLogData,
      id: crypto.randomUUID(),
      status,
    };
    setWorkLogs(prev =>
      [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );
    createWorkLog(newLogData, status).catch(() => {
      setWorkLogs(prev => prev.filter(l => l.id !== newLog.id));
      toast.error('Error al guardar el registro. Intente de nuevo.');
    });
  }, []);

  const updateWorkLogStatus = (logId: string, newStatus: WorkLogStatus, reason?: string) => {
    const snapshot = workLogs.find(l => l.id === logId);
    setWorkLogs(prev =>
      prev.map(log =>
        log.id === logId ? { ...log, status: newStatus, rejectionReason: reason } : log,
      ),
    );
    patchWorkLogStatus(logId, newStatus, reason).catch(() => {
      if (snapshot) setWorkLogs(prev => prev.map(l => l.id === logId ? snapshot : l));
      toast.error('Error al actualizar el estado. Intente de nuevo.');
    });
  };

  const updateMultipleWorkLogsStatus = (updates: { logId: string; status: WorkLogStatus }[]) => {
    setWorkLogs(prev => {
      const map = new Map(updates.map(u => [u.logId, u.status]));
      return prev.map(log => map.has(log.id) ? { ...log, status: map.get(log.id)! } : log);
    });
    // TODO (backend): agregar rollback optimista cuando el servicio esté conectado:
    //   const ids = new Set(updates.map(u => u.logId));
    //   const snapshot = workLogs.filter(l => ids.has(l.id));
    //   Promise.all(updates.map(u => patchWorkLogStatus(u.logId, u.status)))
    //     .catch(() => {
    //       setWorkLogs(prev => prev.map(l => snapshot.find(s => s.id === l.id) ?? l));
    //       toast.error('Error al procesar los registros. Intente de nuevo.');
    //     });
  };

  return { workLogs, isLoading, error, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus };
}
