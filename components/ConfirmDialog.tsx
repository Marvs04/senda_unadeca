import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  variant = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
}) => {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl"
          >
            {/* Icon */}
            <div className={cn(
              'w-12 h-12 rounded-2xl flex items-center justify-center mb-5',
              isDanger ? 'bg-rose-50' : 'bg-zinc-100'
            )}>
              {isDanger
                ? <AlertTriangle className="w-5 h-5 text-rose-600" />
                : <Info className="w-5 h-5 text-zinc-600" />
              }
            </div>

            {/* Content */}
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-8">{message}</p>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onCancel}
                className="py-3 rounded-2xl text-zinc-500 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 hover:bg-zinc-50 transition-all border border-zinc-100"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  'py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg',
                  isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/10'
                )}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
