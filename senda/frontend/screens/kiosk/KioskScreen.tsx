/**
 * screens/kiosk/KioskScreen.tsx
 *
 * Full-screen kiosk board for shared department PCs.
 *
 * Layout:
 *   Left  — credential input (clock in / clock out by typing carnet + password)
 *   Right — live "Currently Working" board with elapsed time per student
 *
 * Dept head actions (cancel session, manage shifts, deactivate) are behind
 * a collapsible panel that also requires credentials.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  LogIn,
  LogOut,
  Users,
  XCircle,
  ShieldCheck,
  Settings,
  Plus,
  Trash2,
  Power,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { KioskState, KioskSession, User, KioskShift, LIMITS } from '../../types';
import { KioskActions, KioskResultCode } from '../../hooks/useKiosk';

// ─── Toast helpers ─────────────────────────────────────────────────────────────────────

function showKioskError(error: string, code?: KioskResultCode) {
  if (code === 'WRONG_DEPT') {
    // Distinct security warning — different colour + longer duration so it's noticed
    toast.warning(`⚠️ Acceso denegado — ${error}`, {
      position: 'top-center',
      duration: 6000,
    });
    return;
  }
  toast.error(error, { position: 'top-center' });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(startedAt: string): string {
  const ms      = Date.now() - new Date(startedAt).getTime();
  const totalSec = Math.floor(ms / 1000);
  const h        = Math.floor(totalSec / 3600);
  const m        = Math.floor((totalSec % 3600) / 60);
  const s        = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface CredentialFormProps {
  onSubmit: (identifier: string, password: string) => void;
  submitLabel: string;
  submitIcon: React.ReactNode;
  submitClass?: string;
  placeholder?: string;
}

const CredentialForm: React.FC<CredentialFormProps> = ({
  onSubmit,
  submitLabel,
  submitIcon,
  submitClass = 'bg-primary hover:bg-primary-hover text-primary-fg',
  placeholder = 'Carnet',
}) => {
  const [id, setId]     = useState('');
  const [pass, setPass] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !pass.trim()) return;
    onSubmit(id.trim(), pass.trim());
    setId('');
    setPass('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        value={id}
        onChange={e => setId(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        type="password"
        value={pass}
        onChange={e => setPass(e.target.value)}
        placeholder="Contraseña"
        className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        type="submit"
        className={cn('w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors', submitClass)}
      >
        {submitIcon}
        {submitLabel}
      </button>
    </form>
  );
};

// ─── Session card ─────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: KioskSession & { user: User };
  onRequestCancel: (studentId: string) => void;
  tick: number;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onRequestCancel, tick }) => {
  void tick; // triggers re-render every second for the clock
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      className="flex items-center justify-between bg-card rounded-2xl border border-border-faint shadow-sm px-5 py-4"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-sm font-bold text-emerald-700">
            {session.user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{session.user.name}</p>
          <p className="text-xs text-faint">Carnet {session.user.carnet}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-faint">Tiempo activo</p>
          <p className="text-sm font-mono font-bold text-foreground">{formatElapsed(session.startedAt)}</p>
        </div>
        <button
          onClick={() => onRequestCancel(session.studentId)}
          title="Cancelar sesión (requiere credenciales de jefe)"
          className="p-2 rounded-lg text-faint hover:text-danger hover:bg-rose-50 transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Cancel modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  studentName: string;
  onConfirm: (headId: string, headPass: string, reason: string) => void;
  onClose: () => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ studentName, onConfirm, onClose }) => {
  const [headId, setHeadId]   = useState('');
  const [headPass, setHeadPass] = useState('');
  const [reason, setReason]   = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headId.trim() || !headPass.trim()) {
      toast.error('Ingresa las credenciales del jefe de departamento.'); return;
    }
    if (!reason.trim()) { toast.error('Debes ingresar una razón.'); return; }
    if (reason.length > LIMITS.KIOSK_CANCEL_REASON) {
      toast.error(`Máximo ${LIMITS.KIOSK_CANCEL_REASON} caracteres.`); return;
    }
    onConfirm(headId.trim(), headPass.trim(), reason.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-3xl shadow-2xl p-8 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-rose-100 rounded-xl">
            <XCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Cancelar sesión</h3>
            <p className="text-xs text-muted">{studentName}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Número de empleado (jefe)"
            value={headId}
            onChange={e => setHeadId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={headPass}
            onChange={e => setHeadPass(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <textarea
            placeholder="Razón del rechazo..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            maxLength={LIMITS.KIOSK_CANCEL_REASON}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors">
              Confirmar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Shift config panel ───────────────────────────────────────────────────────

interface ShiftPanelProps {
  shifts: KioskShift[];
  onSave: (headId: string, headPass: string, shifts: KioskShift[]) => void;
  onClose: () => void;
}

const ShiftPanel: React.FC<ShiftPanelProps> = ({ shifts: initialShifts, onSave, onClose }) => {
  const [shifts, setShifts] = useState<KioskShift[]>(initialShifts);
  const [headId, setHeadId] = useState('');
  const [headPass, setHeadPass] = useState('');

  const addShift = () => setShifts(prev => [...prev, { startTime: '04:00', endTime: '12:00' }]);
  const removeShift = (i: number) => setShifts(prev => prev.filter((_, idx) => idx !== i));
  const updateShift = (i: number, field: keyof KioskShift, value: string) =>
    setShifts(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headId.trim() || !headPass.trim()) {
      toast.error('Ingresa las credenciales del jefe de departamento.');
      return;
    }
    onSave(headId.trim(), headPass.trim(), shifts);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card rounded-3xl shadow-2xl p-8 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-surface rounded-xl">
            <Settings className="w-5 h-5 text-muted" />
          </div>
          <h3 className="text-base font-bold text-foreground">Configurar turnos</h3>
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="space-y-3">
            {shifts.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" value={s.startTime} onChange={e => updateShift(i, 'startTime', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <span className="text-faint text-xs">→</span>
                <input type="time" value={s.endTime} onChange={e => updateShift(i, 'endTime', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={() => removeShift(i)} className="p-2 text-faint hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addShift}
            className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors">
            <Plus className="w-3 h-3" /> Agregar turno
          </button>
          <div className="border-t border-border-faint pt-4 space-y-3">
            <p className="text-xs text-faint font-medium">Credenciales de jefe para confirmar</p>
            <input type="text" placeholder="Número de empleado" value={headId}
              onChange={e => setHeadId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" placeholder="Contraseña" value={headPass}
              onChange={e => setHeadPass(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted hover:bg-surface transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg text-sm font-semibold transition-colors">
              Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

interface KioskScreenProps {
  kiosk: KioskState;
  activeSessions: (KioskSession & { user: User })[];
  isWithinScheduledShift: boolean;
  departmentName: string;
  actions: KioskActions;
}

const KioskScreen: React.FC<KioskScreenProps> = ({
  kiosk,
  activeSessions,
  isWithinScheduledShift,
  departmentName,
  actions,
}) => {
  const [tick, setTick]                     = useState(0);
  const [cancelTarget, setCancelTarget]     = useState<string | null>(null);
  const [showShiftPanel, setShowShiftPanel] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);

  // Tick every second to update elapsed times
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleClockAction = async (identifier: string, password: string) => {
    const alreadyIn = activeSessions.some(s => s.user.carnet?.toLowerCase() === identifier.toLowerCase());
    if (alreadyIn) {
      const result = await actions.clockOut(identifier, password);
      if (!result.ok) { showKioskError(result.error!, result.code); return; }
      toast.success(
        result.name ? `Hasta luego, ${result.name}. Salida registrada.` : 'Salida registrada correctamente.',
        { position: 'top-center' },
      );
    } else {
      const result = await actions.clockIn(identifier, password);
      if (!result.ok) { showKioskError(result.error!, result.code); return; }
      toast.success(
        result.name ? `¡Bienvenido/a, ${result.name}! Entrada registrada.` : 'Entrada registrada. ¡Buen trabajo!',
        { position: 'top-center' },
      );
    }
  };

  const handleCancel = async (headId: string, headPass: string, reason: string) => {
    if (!cancelTarget) return;
    const result = await actions.cancelSession(headId, headPass, cancelTarget, reason);
    if (!result.ok) { showKioskError(result.error!, result.code); return; }
    toast.info('Sesión cancelada. Las horas quedan registradas como rechazadas.', { position: 'top-center' });
    setCancelTarget(null);
  };

  const handleSaveShifts = async (headId: string, headPass: string, shifts: KioskShift[]) => {
    const result = await actions.updateShifts(headId, headPass, shifts);
    if (!result.ok) { showKioskError(result.error!, result.code); return; }
    toast.success('Turnos actualizados.', { position: 'top-center' });
    setShowShiftPanel(false);
  };

  const handleDeactivate = async (identifier: string, password: string) => {
    const result = await actions.deactivate(identifier, password);
    if (!result.ok) { showKioskError(result.error!, result.code); return; }
    toast.info('Kiosco desactivado.', { position: 'top-center' });
  };

  const cancelTargetUser = cancelTarget
    ? activeSessions.find(s => s.studentId === cancelTarget)?.user
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1428] via-[#0f1b33] to-[#1d3261] flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white font-display">SENDA Kiosco</h1>
            <p className="text-xs text-faint">{departmentName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isWithinScheduledShift && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-400">Turno activo</span>
            </span>
          )}
          <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-zinc-300">
            {activeSessions.length} en servicio
          </span>
          <button
            onClick={() => setShowShiftPanel(true)}
            className="p-2 rounded-lg text-muted hover:text-zinc-200 hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeactivate(true)}
            className="p-2 rounded-lg text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Desactivar kiosco"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-0">

        {/* Left: clock in/out panel */}
        <div className="lg:col-span-2 flex flex-col justify-center p-10 border-r border-white/5">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white font-display mb-1">Registrar asistencia</h2>
              <p className="text-sm text-faint">
                Ingresa tu carnet y contraseña para marcar <strong className="text-primary-fg/90">entrada</strong> o <strong className="text-primary-fg/90">salida</strong>.
              </p>
            </div>
            <CredentialForm
              onSubmit={handleClockAction}
              submitLabel="Registrar"
              submitIcon={<LogIn className="w-4 h-4" />}
              submitClass="bg-emerald-600 hover:bg-emerald-500 text-white"
              placeholder="Carnet"
            />
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <ShieldCheck className="w-4 h-4 text-muted shrink-0" />
              <p className="text-xs text-muted">
                Si ya tienes sesión activa, ingresa tus credenciales nuevamente para registrar tu salida.
              </p>
            </div>
          </div>
        </div>

        {/* Right: active sessions board */}
        <div className="lg:col-span-3 flex flex-col p-10">
          <div className="flex items-center gap-3 mb-8">
            <Users className="w-5 h-5 text-faint" />
            <h2 className="text-lg font-semibold text-white">Trabajando ahora</h2>
          </div>

          {activeSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <LogOut className="w-8 h-8 text-[#2a4075]" />
              <p className="text-sm text-[#2a4075]">No hay estudiantes activos en este momento.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto">
              <AnimatePresence>
                {activeSessions.map(session => (
                  <SessionCard
                    key={session.studentId}
                    session={session}
                    onRequestCancel={setCancelTarget}
                    tick={tick}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {cancelTarget && cancelTargetUser && (
          <CancelModal
            studentName={cancelTargetUser.name}
            onConfirm={handleCancel}
            onClose={() => setCancelTarget(null)}
          />
        )}
        {showShiftPanel && (
          <ShiftPanel
            shifts={kiosk.shifts}
            onSave={handleSaveShifts}
            onClose={() => setShowShiftPanel(false)}
          />
        )}
        {showDeactivate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeactivate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl p-8 w-full max-w-sm"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-rose-100 rounded-xl">
                  <Power className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-base font-bold text-foreground">Desactivar kiosco</h3>
              </div>
              <p className="text-xs text-muted mb-6">
                Las sesiones activas se cerrarán y se registrarán sus horas como pendientes de aprobación.
              </p>
              <CredentialForm
                onSubmit={async (id, pass) => {
                  await handleDeactivate(id, pass);
                  setShowDeactivate(false);
                }}
                submitLabel="Desactivar"
                submitIcon={<Power className="w-4 h-4" />}
                submitClass="bg-rose-600 hover:bg-rose-700 text-white"
                placeholder="Número de empleado"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KioskScreen;
