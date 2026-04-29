import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Square, Lock } from 'lucide-react';
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
  isSessionLocked?: boolean;
  lockReason?: string | null;
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
  isSessionLocked = false,
  lockReason,
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
      className="bg-student p-5 sm:p-7 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl shadow-student/40"
    >
      <div className="absolute top-0 right-0 w-40 h-40 sm:w-60 md:w-80 sm:h-60 md:h-80 bg-emerald-500/10 blur-[80px] sm:blur-[100px] md:blur-[120px] -mr-20 sm:-mr-30 md:-mr-40 -mt-20 sm:-mt-30 md:-mt-40" />
      <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-60 md:w-80 sm:h-60 md:h-80 bg-indigo-500/10 blur-[80px] sm:blur-[100px] md:blur-[120px] -ml-20 sm:-ml-30 md:-ml-40 -mb-20 sm:-mb-30 md:-mb-40" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6 sm:mb-9 md:mb-12">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                isTracking
                  ? 'bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]'
                  : 'bg-dark-hover',
              )}
            />
            <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] text-muted">
              {isTracking ? 'En Progreso' : 'Registro de Tiempo'}
            </span>
          </div>
          {isTracking && (
            <button
              onClick={onCancel}
              className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>

        <div className="text-center mb-6 sm:mb-9 md:mb-12">
          <h3 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter font-mono tabular-nums leading-none">
            {formatTime(elapsedTime)}
          </h3>
          {isTracking && description.trim() && (
            <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted mt-3 sm:mt-4 md:mt-6 truncate opacity-60">
              {description.trim().slice(0, 50)}{description.trim().length > 50 ? '…' : ''}
            </p>
          )}
        </div>

        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <div className="relative">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isTracking ? '¿Qué estás trabajando ahora?' : 'Describe la tarea antes de iniciar…'}
              maxLength={LIMITS.DESCRIPTION}
              className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] py-3 sm:py-4 md:py-6 px-4 sm:px-6 md:px-8 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[100px] sm:min-h-[110px] md:min-h-[120px] resize-none placeholder:text-[#2a4075]"
            />
            <div className="absolute bottom-3 sm:bottom-4 md:bottom-6 right-4 sm:right-6 md:right-8 text-[8px] sm:text-[9px] md:text-[10px] font-black text-[#2a4075]">
              {description.length} / {LIMITS.DESCRIPTION}
            </div>
          </div>

          {showShortWarning && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl md:rounded-[2rem] p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-bold text-amber-300">
                Registro muy corto ({Math.floor(elapsedTime / 60000)} min) — ¿deseas registrar o continuar trabajando?
              </p>
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => { setShowShortWarning(false); onFinish(); }}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-300 text-[11px] sm:text-xs md:text-xs font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                >
                  Registrar
                </button>
                <button
                  onClick={() => setShowShortWarning(false)}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl bg-white/5 text-white/60 text-[11px] sm:text-xs md:text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                  Seguir
                </button>
              </div>
            </div>
          )}

          {isSessionLocked && !isTracking && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-1">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-xs sm:text-sm font-bold text-amber-300">Registro de horas bloqueado</p>
              </div>
              {lockReason && (
                <p className="text-[10px] sm:text-xs text-amber-200/60 pl-6">{lockReason}</p>
              )}
            </div>
          )}

          {!isTracking && !isSessionLocked ? (
            <button
              onClick={onStart}
              className="w-full bg-card text-foreground font-black py-4 sm:py-5 md:py-8 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 hover:bg-surface transition-all shadow-xl active:scale-[0.97]"
            >
              <Play className="w-4 sm:w-4 md:w-5 h-4 sm:h-4 md:h-5 fill-foreground" />
              <span className="text-sm sm:text-base md:text-xl tracking-tight">Iniciar Sesión</span>
            </button>
          ) : !isTracking && isSessionLocked ? (
            <button
              disabled
              className="w-full bg-white/5 text-white/30 font-black py-4 sm:py-5 md:py-8 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 cursor-not-allowed"
            >
              <Lock className="w-4 sm:w-4 md:w-5 h-4 sm:h-4 md:h-5" />
              <span className="text-sm sm:text-base md:text-xl tracking-tight">Bloqueado</span>
            </button>
          ) : (
            <button
              onClick={handleFinishClick}
              className="w-full bg-emerald-500 text-white font-black py-4 sm:py-5 md:py-8 rounded-xl sm:rounded-2xl md:rounded-[2.5rem] flex items-center justify-center space-x-2 sm:space-x-3 md:space-x-4 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.97]"
            >
              <Square className="w-4 sm:w-4 md:w-5 h-4 sm:h-4 md:h-5 fill-white" />
              <span className="text-sm sm:text-base md:text-xl tracking-tight">Finalizar Registro</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentTimer;
