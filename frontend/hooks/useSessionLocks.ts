import { useEffect, useRef, useState, useCallback } from 'react';
import * as sessionLocksService from '../services/sessionLocksService';
import { subscribeToTableChanges } from '../lib/realtime';
import { toast } from 'sonner';

export interface SessionLock {
  id: string;
  departmentId: string;
  startDatetime: string;
  endDatetime: string;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface UseSessionLocksResult {
  locks: SessionLock[];
  isLoading: boolean;
  error: string | null;
  isSessionLocked: boolean;
  lockReason: string | null;
  actions: {
    createLock: (startDateTime: string, endDateTime: string, reason?: string) => Promise<void>;
    deleteLock: (lockId: string) => Promise<void>;
    refreshLocks: () => Promise<void>;
    checkLockStatus: () => Promise<void>;
  };
}

export function useSessionLocks(departmentId: string): UseSessionLocksResult {
  const [locks, setLocks] = useState<SessionLock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);

  const departmentIdRef = useRef(departmentId);
  useEffect(() => {
    departmentIdRef.current = departmentId;
  });

  const fetchLocks = useCallback(async () => {
    if (!departmentIdRef.current) return;
    try {
      const data = await sessionLocksService.getLocks(departmentIdRef.current);
      setLocks(data);
      setError(null);
    } catch (err) {
      console.error('[useSessionLocks] Error fetching locks:', err);
      setError('Error al cargar bloqueos');
    }
  }, []);

  const checkLockStatus = useCallback(async () => {
    if (!departmentIdRef.current) return;
    try {
      const result = await sessionLocksService.checkIsLocked(departmentIdRef.current);
      setIsSessionLocked(result.isLocked);
      setLockReason(result.reason || null);
    } catch (err) {
      console.error('[useSessionLocks] Error checking lock status:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchLocks(), checkLockStatus()])
      .finally(() => setIsLoading(false));
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    let refreshTimer: number | null = null;

    const scheduleBackgroundRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        fetchLocks()
          .then(() => checkLockStatus())
          .catch(err => console.warn('[useSessionLocks] Realtime refresh failed', err));
      }, 250);
    };

    const unsubscribe = subscribeToTableChanges({
      table: 'session_locks',
      onChange: scheduleBackgroundRefresh,
    });

    return () => {
      unsubscribe();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, []);

  const createLock = useCallback(async (startDateTime: string, endDateTime: string, reason?: string) => {
    try {
      await sessionLocksService.createLock(departmentIdRef.current, startDateTime, endDateTime, reason);
      await fetchLocks();
      toast.success('Bloqueo de horas creado exitosamente', { position: 'top-center' });
    } catch (err) {
      toast.error('Error al crear el bloqueo', { position: 'top-center' });
      throw err;
    }
  }, []);

  const deleteLock = useCallback(async (lockId: string) => {
    try {
      await sessionLocksService.deleteLock(lockId);
      await fetchLocks();
      toast.success('Bloqueo eliminado exitosamente', { position: 'top-center' });
    } catch (err) {
      toast.error('Error al eliminar el bloqueo', { position: 'top-center' });
      throw err;
    }
  }, []);

  return {
    locks,
    isLoading,
    error,
    isSessionLocked,
    lockReason,
    actions: {
      createLock,
      deleteLock,
      refreshLocks: fetchLocks,
      checkLockStatus,
    },
  };
}
