import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Square, Clock, User, AlertTriangle } from 'lucide-react';
import { useActiveSessions } from '../../hooks/useActiveSessions';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

function formatElapsed(startedAt: string): string {
  const ms = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const h  = Math.floor(ms / 3_600_000);
  const m  = Math.floor((ms / 60_000) % 60);
  const s  = Math.floor((ms / 1000) % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatStartTime(startedAt: string): string {
  return new Date(startedAt).toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Stop reason form ────────────────────────────────────────────────────────
const StopForm: React.FC<{
  sessionId: string;
  departmentId: string;
  onStop: (id: string, deptId: string, reason: string) => Promise<void>;
  onCancel: () => void;
}> = ({ sessionId, departmentId, onStop, onCancel }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Ingresa una razón para detener la sesión', { position: 'top-center' });
      return;
    }
    setLoading(true);
    try {
      await onStop(sessionId, departmentId, reason.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="mt-4 pt-4 border-t border-red-200 space-y-3">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs font-bold">Detener sesión del estudiante</span>
        </div>
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Razón para detener (ej: horas no autorizadas)…"
          autoFocus
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-surface transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Deteniendo…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

// ─── Single session card ──────────────────────────────────────────────────────
const SessionCard: React.FC<{
  session: ReturnType<typeof useActiveSessions>['sessions'][number];
  onStop: (id: string, deptId: string, reason: string) => Promise<void>;
}> = ({ session, onStop }) => {
  const [showStop, setShowStop] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className={cn(
        'p-5 rounded-2xl border transition-colors',
        showStop ? 'border-red-200 bg-red-50/50' : 'border-border-faint bg-card hover:border-border',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Avatar + info */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">
              {session.student?.name ?? 'Estudiante'}
            </p>
            {session.student?.carnet && (
              <p className="text-[11px] font-mono text-faint mt-0.5">{session.student.carnet}</p>
            )}
            {session.description && (
              <p className="text-xs text-muted mt-1 line-clamp-1 max-w-[220px]">
                {session.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <Clock className="w-3 h-3 text-faint" />
              <span className="text-[11px] text-faint">
                Inició a las {formatStartTime(session.startedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Live timer + stop button */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-xl font-black font-mono tabular-nums text-emerald-600 tracking-tight">
            {formatElapsed(session.startedAt)}
          </span>
          <button
            onClick={() => setShowStop(p => !p)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors',
              showStop
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-surface border border-border text-muted hover:border-red-300 hover:text-red-600',
            )}
          >
            <Square className="w-3 h-3" />
            {showStop ? 'Cancelar' : 'Detener'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showStop && (
          <StopForm
            sessionId={session.id}
            departmentId={session.departmentId}
            onStop={onStop}
            onCancel={() => setShowStop(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main section ─────────────────────────────────────────────────────────────
const DeptHeadLiveSessionsSection: React.FC<{
  departmentId: string | undefined;
}> = ({ departmentId }) => {
  const { sessions, isLoading, stopSession } = useActiveSessions(departmentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[2rem] border border-border-faint shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border-faint">
        <div className="flex items-center gap-4">
          <div className="relative p-3 rounded-xl bg-emerald-100">
            <Activity className="w-5 h-5 text-emerald-600" />
            {sessions.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Sesiones en Vivo</h3>
            <p className="text-xs text-muted">
              {sessions.length > 0
                ? `${sessions.length} estudiante${sessions.length !== 1 ? 's' : ''} registrando horas ahora`
                : 'Ningún estudiante activo en este momento'}
            </p>
          </div>
        </div>
        {sessions.length > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            En vivo
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-8 py-6">
        {isLoading ? (
          <p className="text-sm text-faint text-center py-4">Cargando sesiones…</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-faint italic text-center py-4">
            Cuando un estudiante inicie su temporizador aparecerá aquí automáticamente.
          </p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onStop={stopSession}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DeptHeadLiveSessionsSection;
