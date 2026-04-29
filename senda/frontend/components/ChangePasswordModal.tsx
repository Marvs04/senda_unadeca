import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { changePassword } from '../services';
import { toast } from 'sonner';

interface ChangePasswordModalProps {
  userName: string;
  onComplete: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ userName, onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(newPassword);
      toast.success('Contraseña actualizada correctamente.');
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cambiar contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-dark/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-card w-full max-w-md rounded-[3rem] shadow-2xl shadow-border/40 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-blue-700 px-10 py-8 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white text-2xl font-black tracking-tight">Cambiar contraseña</h2>
          <p className="text-white/75 text-sm mt-1">Primer inicio de sesión, {userName}</p>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-5">
          <p className="text-sm text-muted leading-relaxed">
            Por seguridad debes establecer una nueva contraseña antes de continuar. No podrás acceder al sistema sin completar este paso.
          </p>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-faint ml-4">Nueva contraseña</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
                className="w-full bg-surface border-none rounded-[2rem] py-5 pl-14 pr-14 text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                aria-label={showNew ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-faint hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-faint ml-4">Confirmar contraseña</label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-faint" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                required
                className="w-full bg-surface border-none rounded-[2rem] py-5 pl-14 pr-14 text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all"
              />
              <button
                type="button"
                aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-faint hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white rounded-[2rem] py-5 text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Guardando…' : 'Establecer contraseña'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ChangePasswordModal;
