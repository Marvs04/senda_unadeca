import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { User, WorkLog, LIMITS } from '../../types';

interface DeptHeadRejectionModalProps {
  rejectingLog: WorkLog | null;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  allUsers: User[];
}

const DeptHeadRejectionModal: React.FC<DeptHeadRejectionModalProps> = ({
  rejectingLog,
  rejectionReason,
  setRejectionReason,
  onConfirm,
  onClose,
  allUsers,
}) => {
  return (
    <AnimatePresence>
      {rejectingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold">Rechazar Registro</h3>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Por favor, indica la razón por la cual estás rechazando las{' '}
                <strong>{rejectingLog.hours}h</strong> del estudiante{' '}
                <strong>{allUsers.find(u => u.id === rejectingLog.studentId)?.name}</strong>.
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Razón del Rechazo
                  </label>
                  <span className="text-[10px] font-bold text-zinc-300">
                    {rejectionReason.length} / {LIMITS.REJECTION_REASON}
                  </span>
                </div>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-4 top-4 text-zinc-400" />
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    rows={3}
                    maxLength={LIMITS.REJECTION_REASON}
                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-4 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all text-sm"
                    placeholder="Ej. Descripción insuficiente, horas incorrectas..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={onClose}
                className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="py-4 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
              >
                Confirmar Rechazo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeptHeadRejectionModal;
