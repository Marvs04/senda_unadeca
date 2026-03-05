/**
 * hooks/useStudentSession.ts
 *
 * Manages the real-time timer for student hour tracking.
 * Persists the active session to localStorage so a page refresh
 * doesn't lose in-progress time.
 *
 * Extracted from StudentPortal: timer state + both useEffects +
 * handleStart / handleFinish / handleCancel.
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { WorkLog, LIMITS } from '../types';
import { getCostaRicaISODate } from '../lib/utils';
import { useConfirm } from './useConfirm';

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

  // ── Restore persisted session on mount ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY(userId));
    if (!saved) return;
    const { start, desc } = JSON.parse(saved) as { start: number; desc: string };
    setStartTime(start);
    setDescription(desc);
    setIsTracking(true);
  }, [userId]);

  // ── Tick every second while tracking ────────────────────────────────────────
  useEffect(() => {
    if (!isTracking || !startTime) {
      setElapsedTime(0);
      return;
    }
    const interval = setInterval(() => setElapsedTime(Date.now() - startTime), 1000);
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsTracking(true);
    localStorage.setItem(SESSION_KEY(userId), JSON.stringify({ start: now, desc: description }));
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

    addWorkLog({
      studentId:    userId,
      departmentId: departmentId ?? 'N/A',
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
