import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Square, User } from 'lucide-react';
import { useActiveSessions } from '../../hooks/useActiveSessions';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

function formatElapsed(startedAt: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const h = Math.floor(elapsed / (1000 * 60 * 60));
  const m = Math.floor((elapsed / (1000 * 60)) % 60);
  const s = Math.floor((elapsed / 1000) % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

interface StopFormProps {
  sessionId: string;
  departmentId: string;
  onStop: (sessionId: string, departmentId: string, reason: string) => Promise<void>;
  onCancel: () => void;
}

const StopForm: React.FC<StopFormProps> = ({ sessionId, departmentId, onStop, onCancel }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Ingresa una razón para detener la sesión', { position: 'top-center' });
      return;
    }
    try {
      setLoading(true);
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
      className="mt-3 space-y-2"
      onClick={e => e.stopPropagation()}
    >
      <input
        type="text"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Razón para detener la sesión…"
        autoFocus
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-1.5 rounded-lg border border-border text-xs font-medium text-muted hover:bg-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
        >
          {loading ? 'Deteniendo…' : 'Detener sesión'}
        </button>
      </div>
    </motion.form>
  );
};

interface DeptHeadLiveSessionsSectionProps {
  departmentId: string | undefined;
}

const DeptHeadLiveSessionsSection: React.FC<DeptHeadLiveSessionsSectionProps> = ({ departmentId }) => {
  const { sessions, stopSession } = useActiveSessions(departmentId);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Update elapsed times every second
  useEffect(() => {
    if (sessions.length === 0) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [sessions.length]);

  if (sessions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-8 rounded-[2rem] border border-emerald-500/20 shadow-sm"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-emerald-100 relative">
          <Activity className="w-5 h-5 text-emerald-600" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Sesiones en Progreso</h3>
          <p className="text-xs text-muted">
            {sessions.length} estudiante{sessions.length !== 1 ? 's' : ''} trabajando ahora
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {sessions.map(session => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-surface rounded-2xl border border-border-faint"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-100 shrink-0 mt-0.5">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">
                        {session.student?.name ?? session.studentId}
                      </p>
                      {session.student?.carnet && (
                        <span className="text-[10px] font-mono text-faint">
                          {session.student.carnet}
                        </span>
                      )}
                    </div>
                    {session.description && (
                      <p className="text-xs text-muted mt-0.5 truncate">
                        {session.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-base font-black font-mono tabular-nums text-emerald-600">
                    {formatElapsed(session.startedAt)}
                  </span>
                  <button
                    onClick={() => setStoppingId(id => id === session.id ? null : session.id)}
                    className={cn(
                      'p-2 rounded-lg transition-colors',
                      stoppingId === session.id
                        ? 'bg-red-100 text-red-600'
                        : 'text-muted hover:bg-red-50 hover:text-red-600',
                    )}
                    title="Detener sesión"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {stoppingId === session.id && (
                  <StopForm
                    sessionId={session.id}
                    departmentId={session.departmentId}
                    onStop={stopSession}
                    onCancel={() => setStoppingId(null)}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DeptHeadLiveSessionsSection;
