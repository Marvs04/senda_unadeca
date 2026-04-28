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
import { getWorkLogs, createWorkLog, patchWorkLogStatus, bulkPatchWorkLogStatus } from '../services';
import { subscribeToTableChanges } from '../lib/realtime';
import { toast } from 'sonner';

export function useWorkLogs() {
  const [workLogs, setWorkLogs]   = useState<WorkLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | null = null;

    const syncWorkLogs = async (isInitialLoad: boolean) => {
      if (isInitialLoad) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const data = await getWorkLogs();
        if (cancelled) return;
        setWorkLogs(data);
        if (isInitialLoad) setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        if (isInitialLoad) {
          setError(err instanceof Error ? err.message : 'Error al cargar registros de horas');
          setIsLoading(false);
          return;
        }
        // Keep the last good state when realtime refresh fails.
        console.warn('[Realtime] No se pudo sincronizar bitacoras', err);
      }
    };

    const scheduleBackgroundSync = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        void syncWorkLogs(false);
      }, 250);
    };

    void syncWorkLogs(true);

    const unsubscribeRealtime = subscribeToTableChanges({
      table: 'work_logs',
      onChange: scheduleBackgroundSync,
    });

    return () => {
      cancelled = true;
      unsubscribeRealtime();
      if (refreshTimer !== null) {
        window.clearTimeout(refreshTimer);
      }
    };
  }, []);

  // ── Mutaciones optimistas ─────────────────────────────────────────────────

  const addWorkLog = useCallback((
    newLogData: Omit<WorkLog, 'id' | 'status'>,
    status: WorkLogStatus = WorkLogStatus.PENDING,
  ) => {
    const tempId = crypto.randomUUID();
    const newLog: WorkLog = {
      ...newLogData,
      id: tempId,
      status,
    };
    setWorkLogs(prev =>
      [newLog, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    );
    createWorkLog(newLogData, status)
      .then(created => {
        setWorkLogs(prev =>
          prev
            .map(log => (log.id === tempId ? created : log))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        );
      })
      .catch(() => {
        setWorkLogs(prev => prev.filter(l => l.id !== tempId));
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
    patchWorkLogStatus(logId, newStatus, reason)
      .then(updated => {
        setWorkLogs(prev => prev.map(log => (log.id === updated.id ? updated : log)));
      })
      .catch(() => {
        if (snapshot) setWorkLogs(prev => prev.map(l => l.id === logId ? snapshot : l));
        toast.error('Error al actualizar el estado. Intente de nuevo.');
      });
  };

  const updateMultipleWorkLogsStatus = (
    updates: { logId: string; status: WorkLogStatus; rejectionReason?: string }[],
  ) => {
    const targetIds = new Set(updates.map(u => u.logId));
    const snapshot = workLogs.filter(log => targetIds.has(log.id));
    const snapshotMap = new Map(snapshot.map(log => [log.id, log]));

    setWorkLogs(prev => {
      const map = new Map(updates.map(u => [u.logId, u.status]));
      return prev.map(log => map.has(log.id) ? { ...log, status: map.get(log.id)! } : log);
    });

    bulkPatchWorkLogStatus(updates)
      .then(updatedLogs => {
        const updatedMap = new Map(updatedLogs.map(log => [log.id, log]));
        setWorkLogs(prev => prev.map(log => updatedMap.get(log.id) ?? log));
      })
      .catch(() => {
        setWorkLogs(prev => prev.map(log => snapshotMap.get(log.id) ?? log));
        toast.error('Error al procesar los registros. Intente de nuevo.');
      });
  };

  return { workLogs, isLoading, error, addWorkLog, updateWorkLogStatus, updateMultipleWorkLogsStatus };
}
