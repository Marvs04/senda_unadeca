import React from 'react';
import {
  ShieldCheck,
  Key,
  Plus,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Briefcase,
} from 'lucide-react';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';

interface SuperAdminCreateFormProps {
  adminName: string;
  setAdminName: (v: string) => void;
  adminRole: UserRole;
  setAdminRole: (v: UserRole) => void;
  adminPassword: string;
  setAdminPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const SuperAdminCreateForm: React.FC<SuperAdminCreateFormProps> = ({
  adminName,
  setAdminName,
  adminRole,
  setAdminRole,
  adminPassword,
  setAdminPassword,
  onSubmit,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-zinc-100 rounded-xl">
            <UserPlus className="w-4 h-4 text-zinc-600" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Nueva Cuenta</h3>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Role toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Tipo de Cuenta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdminRole(UserRole.ADMIN)}
                className={cn(
                  'py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2',
                  adminRole === UserRole.ADMIN
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100',
                )}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminRole(UserRole.ACCOUNTING)}
                className={cn(
                  'py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2',
                  adminRole === UserRole.ACCOUNTING
                    ? 'bg-zinc-900 border-zinc-900 text-white'
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:bg-zinc-100',
                )}
              >
                <Briefcase className="w-3 h-3" />
                <span>Conta</span>
              </button>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={adminName}
              onChange={e => setAdminName(e.target.value)}
              className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Contraseña Temporal
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-zinc-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 flex items-center justify-center space-x-3 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Cuenta</span>
            <ArrowRight className="w-4 h-4 opacity-50" />
          </button>
        </form>
      </div>

      {/* Security Notice */}
      <div className="p-8 rounded-[2rem] bg-rose-50 border border-rose-100 text-rose-900">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          <h4 className="text-sm font-bold uppercase tracking-widest">Seguridad</h4>
        </div>
        <p className="text-xs leading-relaxed opacity-70">
          Como Super Admin, eres responsable de la integridad de las cuentas. Asegúrate de
          verificar la identidad antes de resetear claves.
        </p>
      </div>
    </div>
  );
};

export default SuperAdminCreateForm;
