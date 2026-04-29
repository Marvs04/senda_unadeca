import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, X, Plus, Trash2, Clock } from 'lucide-react';
import { useSessionLocks } from '../../hooks/useSessionLocks';
import { cn, formatCostaRicaLongDate } from '../../lib/utils';
import { toast } from 'sonner';

interface DeptHeadSessionLocksSectionProps {
  departmentId: string;
}

const DeptHeadSessionLocksSection: React.FC<DeptHeadSessionLocksSectionProps> = ({ departmentId }) => {
  const { locks, actions } = useSessionLocks(departmentId);
  const [showForm, setShowForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateLock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !startTime || !endDate || !endTime) {
      toast.error('Por favor completa fecha y hora de inicio y fin', { position: 'top-center' });
      return;
    }

    const startDateTime = `${startDate}T${startTime}`;
    const endDateTime = `${endDate}T${endTime}`;

    if (new Date(startDateTime) >= new Date(endDateTime)) {
      toast.error('La fecha/hora de inicio debe ser anterior a la fecha/hora de fin', { position: 'top-center' });
      return;
    }

    try {
      setIsSubmitting(true);
      await actions.createLock(startDateTime, endDateTime, reason || undefined);
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setReason('');
      setShowForm(false);
    } catch {
      // Error already shown by hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLock = async (lockId: string) => {
    const ok = window.confirm('¿Estás seguro de que deseas eliminar este bloqueo?');
    if (!ok) return;

    try {
      await actions.deleteLock(lockId);
    } catch {
      // Error already shown by hook
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-8 rounded-[2rem] border border-border-faint shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Bloquear Registro de Horas</h3>
            <p className="text-xs text-muted">Rango de fechas/horas sin registros permitidos</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            'px-4 py-2 rounded-xl font-medium text-sm transition-all',
            showForm
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center gap-2',
          )}
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Nuevo Bloqueo
            </>
          )}
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateLock}
            className="mb-6 p-6 bg-surface rounded-2xl border border-border-faint space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-faint mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-faint mb-2">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-faint mb-2">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-faint mb-2">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-faint mb-2">
                Razón (Opcional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej: Mantenimiento del sistema, festivo, etc."
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted hover:bg-surface transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando...' : 'Crear Bloqueo'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Locks list */}
      {locks.length > 0 ? (
        <div className="space-y-3">
          {locks.map(lock => (
            <motion.div
              key={lock.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-start justify-between p-4 bg-surface rounded-lg border border-border-faint hover:border-border transition-colors"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 mt-0.5 rounded-lg bg-blue-100">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(lock.startDatetime).toLocaleDateString('es-CR')} {new Date(lock.startDatetime).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-xs text-muted">→</span>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(lock.endDatetime).toLocaleDateString('es-CR')} {new Date(lock.endDatetime).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {lock.reason && (
                    <p className="text-xs text-muted mt-1">{lock.reason}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDeleteLock(lock.id)}
                className="ml-2 p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Eliminar bloqueo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        !showForm && (
          <p className="text-sm text-muted italic text-center py-8">
            No hay bloqueos activos. Los estudiantes pueden registrar horas normalmente.
          </p>
        )
      )}
    </motion.div>
  );
};

export default DeptHeadSessionLocksSection;
