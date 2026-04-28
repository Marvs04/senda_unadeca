import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Square } from 'lucide-react';
import { LIMITS } from '../../types';
import { cn } from '../../lib/utils';

interface StudentTimerProps {
  isTracking: boolean;
  elapsedTime: number;
  description: string;
  setDescription: (v: string) => void;
  onStart: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

const formatTime = (ms: number) => {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const StudentTimer: React.FC<StudentTimerProps> = ({
  isTracking,
  elapsedTime,
  description,
  setDescription,
  onStart,
  onFinish,
  onCancel,
}) => {
  const [showShortWarning, setShowShortWarning] = useState(false);

  const handleFinishClick = () => {
    const MIN_MS = 15 * 60 * 1000; // 15 minutos
    if (elapsedTime < MIN_MS) {
      setShowShortWarning(true);
    } else {
      setShowShortWarning(false);
      onFinish();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-student p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl shadow-student/40"
    >
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] -mr-40 -mt-40" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 blur-[120px] -ml-40 -mb-40" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isTracking
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                  : 'bg-dark-hover',
              )}
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">
              {isTracking ? 'En Progreso' : 'Registro de Tiempo'}
            </span>
          </div>
          {isTracking && (
            <button
              onClick={onCancel}
              className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="text-center mb-12">
          <h3 className="text-8xl font-black tracking-tighter font-mono tabular-nums leading-none">
            {formatTime(elapsedTime)}
          </h3>
          {isTracking && description.trim() && (
            <p className="text-[10px] font-bold text-muted mt-6 truncate opacity-60">
              {description.trim().slice(0, 50)}{description.trim().length > 50 ? '…' : ''}
            </p>
          )}
        </div>

        <div className="space-y-6">
          <div className="relative">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isTracking ? '¿Qué estás trabajando ahora?' : 'Describe la tarea antes de iniciar…'}
              maxLength={LIMITS.DESCRIPTION}
              className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[120px] resize-none placeholder:text-[#2a4075]"
            />
            <div className="absolute bottom-6 right-8 text-[10px] font-black text-[#2a4075]">
              {description.length} / {LIMITS.DESCRIPTION}
            </div>
          </div>

          {showShortWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-[2rem] p-6 space-y-4">
              <p className="text-sm font-bold text-amber-300">
                Registro muy corto ({Math.floor(elapsedTime / 60000)} min) — ¿deseas registrar o continuar trabajando?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowShortWarning(false); onFinish(); }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                >
                  Registrar de todas formas
                </button>
                <button
                  onClick={() => setShowShortWarning(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/5 text-white/60 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Seguir trabajando
                </button>
              </div>
            </div>
          )}

          {!isTracking ? (
            <button
              onClick={onStart}
              className="w-full bg-card text-foreground font-black py-8 rounded-[2.5rem] flex items-center justify-center space-x-4 hover:bg-surface transition-all shadow-xl active:scale-[0.97]"
            >
              <Play className="w-5 h-5 fill-foreground" />
              <span className="text-xl tracking-tight">Iniciar Sesión</span>
            </button>
          ) : (
            <button
              onClick={handleFinishClick}
              className="w-full bg-emerald-500 text-white font-black py-8 rounded-[2.5rem] flex items-center justify-center space-x-4 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.97]"
            >
              <Square className="w-5 h-5 fill-white" />
              <span className="text-xl tracking-tight">Finalizar Registro</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentTimer;
