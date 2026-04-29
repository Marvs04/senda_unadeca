/**
 * hooks/useStudentSession.ts
 *
 * Manages the real-time timer for student hour tracking.
 * Persists the active session to localStorage so a page refresh
 * doesn't lose in-progress time.
 *
 * Also syncs to the `active_timer_sessions` DB table so dept heads
 * can see live sessions and optionally stop them.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { WorkLog, LIMITS } from '../types';
// toast is still used for start/finish/cancel feedback
import { getCostaRicaISODate } from '../lib/utils';
import { useConfirm } from './useConfirm';
import { subscribeToTableChanges } from '../lib/realtime';
import * as activeSessionService from '../services/activeTimerSessionsService';

interface UseStudentSessionOptions {
  userId: string;
  departmentId: string | undefined;
  addWorkLog: (data: Omit<WorkLog, 'id' | 'status'>) => void;
}

const SESSION_KEY = (userId: string) => `senda_session_${userId}`;

export function useStudentSession({
  userId,
  departmentId,
  addWorkLog,
}: UseStudentSessionOptions) {
  const [isTracking, setIsTracking]   = useState(false);
  const [startTime,  setStartTime]    = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const [stoppedByHeadReason, setStoppedByHeadReason] = useState<string | null>(null);

  const { confirm, dialogProps: sessionConfirmProps } = useConfirm();

  const departmentIdRef = useRef(departmentId);
  useEffect(() => { departmentIdRef.current = departmentId; });

  // Clears all timer state and localStorage; used by force-stop from dept head
  const forceStop = useCallback((reason?: string) => {
    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription('');
    localStorage.removeItem(SESSION_KEY(userId));
    setStoppedByHeadReason(reason ?? '');
  }, [userId]);

  // ── Restore persisted session on mount ──────────────────────────────────────
  // Always query the DB first — the server's startedAt is the authoritative
  // reference so the elapsed counter is consistent across devices and after
  // re-login. localStorage is only used as a fallback when the network is down.
  useEffect(() => {
    let cancelled = false;

    activeSessionService.getMySession().then(dbSession => {
      if (cancelled) return;

      if (!dbSession) {
        // No active DB session — clear any stale localStorage entry
        localStorage.removeItem(SESSION_KEY(userId));
        return;
      }

      // Use the server's startedAt as the single source of truth for elapsed time
      const serverStart = new Date(dbSession.startedAt).getTime();
      const elapsedHours = (Date.now() - serverStart) / (1000 * 60 * 60);

      if (elapsedHours > LIMITS.MAX_HOURS) {
        localStorage.removeItem(SESSION_KEY(userId));
        activeSessionService.endSession().catch(() => {});
        return;
      }

      // Prefer description from localStorage (user may have typed more), fall back to DB
      const savedStr = localStorage.getItem(SESSION_KEY(userId));
      const desc = savedStr ? (JSON.parse(savedStr) as { desc: string }).desc : (dbSession.description ?? '');

      // Sync localStorage with the authoritative server timestamp
      localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: serverStart, desc }));

      setStartTime(serverStart);
      setDescription(desc);
      setIsTracking(true);
    }).catch(() => {
      // Network error — fall back to localStorage so a refresh doesn't lose the session
      const saved = localStorage.getItem(SESSION_KEY(userId));
      if (!saved || cancelled) return;
      const { start, desc } = JSON.parse(saved) as { start: number; desc: string };
      const elapsedHours = (Date.now() - start) / (1000 * 60 * 60);
      if (elapsedHours > LIMITS.MAX_HOURS) {
        localStorage.removeItem(SESSION_KEY(userId));
        activeSessionService.endSession().catch(() => {});
        return;
      }
      setStartTime(start);
      setDescription(desc);
      setIsTracking(true);
    });

    return () => { cancelled = true; };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tick every second while tracking ────────────────────────────────────────
  useEffect(() => {
    if (!isTracking || !startTime) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => setElapsedTime(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // ── Realtime: detect force-stop by dept head ────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToTableChanges({
      table: 'active_timer_sessions',
      filter: `student_id=eq.${userId}`,
      event: 'UPDATE',
      onChange: (payload) => {
        const record = payload.new as { status?: string; stop_reason?: string };
        if (record.status === 'STOPPED_BY_HEAD') {
          forceStop(record.stop_reason ?? undefined);
          activeSessionService.endSession().catch(() => {});
        }
      },
    });
    return unsubscribe;
  }, [userId, forceStop]);

  // ── Realtime: sync timer when a session starts (this device or another) ─────
  // INSERT fires both when THIS device creates a session (→ updates startTime to
  // server-authoritative value) and when ANOTHER device starts a session (→ auto-
  // starts the counter here without needing a page reload).
  // The old DELETE subscription has been removed because it caused a race condition:
  // the backend deletes the previous session before inserting the new one, so the
  // DELETE event was resetting the timer mid-start.
  useEffect(() => {
    const unsubscribe = subscribeToTableChanges({
      table: 'active_timer_sessions',
      filter: `student_id=eq.${userId}`,
      event: 'INSERT',
      onChange: (payload) => {
        const record = payload.new as { started_at: string; description?: string };
        const serverStart = new Date(record.started_at).getTime();
        const elapsedHours = (Date.now() - serverStart) / (1000 * 60 * 60);
        if (elapsedHours > LIMITS.MAX_HOURS) return;

        const desc = record.description ?? '';
        setStartTime(serverStart);
        setIsTracking(true);
        // Only overwrite description if the user hasn't typed anything locally
        setDescription(prev => prev || desc);
        localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: serverStart, desc }));
      },
    });
    return unsubscribe;
  }, [userId]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleStart = async () => {
    // Optimistic start with local time so the UI reacts instantly
    const localStart = Date.now();
    setStartTime(localStart);
    setIsTracking(true);
    localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: localStart, desc: description }));

    // Persist to DB so dept head can see this session, and get the authoritative startedAt
    const dept = departmentIdRef.current;
    if (dept) {
      try {
        const session = await activeSessionService.startSession(dept, description);
        // Replace local time with server time so all devices stay in sync
        const serverStart = new Date(session.startedAt).getTime();
        setStartTime(serverStart);
        localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: serverStart, desc: description }));
      } catch (err) {
        console.warn('[StudentSession] DB persist failed:', err);
        // Keep local time as fallback — session still works offline
      }
    }

    toast.success('Sesión iniciada correctamente', { position: 'top-center' });
  };

  const handleCancel = async () => {
    const ok = await confirm(
      '¿Cancelar la sesión actual? Se perderá el tiempo transcurrido.',
      { variant: 'danger', title: 'Cancelar sesión' },
    );
    if (!ok) return;

    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription('');
    localStorage.removeItem(SESSION_KEY(userId));
    activeSessionService.endSession().catch(() => {});
    toast.info('Sesión cancelada', { position: 'top-center' });
  };

  const handleFinish = () => {
    if (!description.trim()) {
      toast.error('Debes ingresar una descripción de las tareas realizadas.', {
        position: 'top-center',
      });
      return;
    }
    if (description.length > LIMITS.DESCRIPTION) {
      toast.error(`La descripción no puede exceder los ${LIMITS.DESCRIPTION} caracteres.`, {
        position: 'top-center',
      });
      return;
    }
    if (!startTime) return;

    const endedAt = Date.now();
    const durationHours = parseFloat(
      ((endedAt - startTime) / (1000 * 60 * 60)).toFixed(2),
    );
    if (durationHours < 0.01) {
      toast.error('La sesión es demasiado corta para ser registrada.', {
        position: 'top-center',
      });
      return;
    }
    if (durationHours > LIMITS.MAX_HOURS) {
      toast.error(
        `La sesión excede el límite de ${LIMITS.MAX_HOURS} horas (${durationHours.toFixed(1)}h registradas). Cancela y registra manualmente si es necesario.`,
        { position: 'top-center', duration: 8000 },
      );
      return;
    }

    addWorkLog({
      studentId:    userId,
      departmentId: departmentIdRef.current ?? 'N/A',
      date:         getCostaRicaISODate(endedAt),
      hours:        durationHours,
      description,
      entrySource:  'MANUAL',
      startTime:    new Date(startTime).toISOString(),
      endTime:      new Date(endedAt).toISOString(),
    });

    setIsTracking(false);
    setStartTime(null);
    setDescription('');
    localStorage.removeItem(SESSION_KEY(userId));
    activeSessionService.endSession().catch(() => {});
    toast.success('Sesión finalizada y registrada para revisión', { position: 'top-center' });
  };

  return {
    isTracking,
    elapsedTime,
    description,
    setDescription,
    handleStart,
    handleFinish,
    handleCancel,
    sessionConfirmProps,
    stoppedByHeadReason,
    dismissStoppedByHead: () => setStoppedByHeadReason(null),
  };
}
