import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import * as service from '../services/activeTimerSessionsService';
import type { ActiveTimerSession } from '../services/activeTimerSessionsService';
import { subscribeToTableChanges } from '../lib/realtime';

export type { ActiveTimerSession };

export interface UseActiveSessionsResult {
  sessions: ActiveTimerSession[];
  isLoading: boolean;
  stopSession: (sessionId: string, departmentId: string, reason: string) => Promise<void>;
}

export function useActiveSessions(departmentId: string | undefined): UseActiveSessionsResult {
  const [sessions, setSessions] = useState<ActiveTimerSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const deptRef = useRef(departmentId);
  useEffect(() => { deptRef.current = departmentId; });

  const fetchSessions = useCallback(async () => {
    if (!deptRef.current) return;
    try {
      const data = await service.getActiveSessions(deptRef.current);
      setSessions(data);
    } catch (err) {
      console.warn('[useActiveSessions] fetch failed', err);
    }
  }, []);

  useEffect(() => {
    if (!departmentId) return;
    setIsLoading(true);
    fetchSessions().finally(() => setIsLoading(false));
  }, [departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: refresh when active_timer_sessions changes for this dept
  useEffect(() => {
    if (!departmentId) return;
    let timer: number | null = null;

    const schedule = () => {
      if (timer !== null) return;
      timer = window.setTimeout(() => {
        timer = null;
        fetchSessions();
      }, 250);
    };

    const unsub = subscribeToTableChanges({
      table: 'active_timer_sessions',
      onChange: schedule,
    });

    return () => {
      unsub();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [departmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopSession = useCallback(async (sessionId: string, deptId: string, reason: string) => {
    try {
      await service.stopSession(sessionId, deptId, reason);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast.success('Sesión detenida correctamente', { position: 'top-center' });
    } catch (err) {
      toast.error('Error al detener la sesión', { position: 'top-center' });
      throw err;
    }
  }, []);

  return { sessions, isLoading, stopSession };
}
