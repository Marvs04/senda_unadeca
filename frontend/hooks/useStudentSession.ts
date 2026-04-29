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

    if (reason) {
      toast.error(`Tu sesión fue detenida por el jefe de departamento. Razón: ${reason}`, {
        position: 'top-center',
        duration: 8000,
      });
    } else {
      toast.info('Tu sesión fue detenida por el jefe de departamento.', {
        position: 'top-center',
        duration: 6000,
      });
    }
  }, [userId]);

  // ── Restore persisted session on mount ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY(userId));
    if (!saved) return;
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

    // Re-upsert into DB in case the record was cleaned up
    const dept = departmentIdRef.current;
    if (dept) {
      activeSessionService.startSession(dept, desc).catch(() => {});
    }
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

  // ── Realtime: detect force-stop by dept head ─────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToTableChanges({
      table: 'active_timer_sessions',
      filter: `student_id=eq.${userId}`,
      event: 'UPDATE',
      onChange: (payload) => {
        const record = payload.new as { status?: string; stop_reason?: string };
        if (record.status === 'STOPPED_BY_HEAD') {
          forceStop(record.stop_reason ?? undefined);
          // Clean up the DB record so the dept head sees the session disappear
          activeSessionService.endSession().catch(() => {});
        }
      },
    });
    return unsubscribe;
  }, [userId, forceStop]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsTracking(true);
    localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: now, desc: description }));

    // Fire-and-forget: persist to DB so dept head can see this session
    const dept = departmentIdRef.current;
    if (dept) {
      activeSessionService.startSession(dept, description).catch(err =>
        console.warn('[StudentSession] DB persist failed:', err),
      );
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
  };
}
