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
import { Input, Button } from '../../components/ui';

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
      <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
        <div className="flex items-center space-x-3 mb-8">
          <div className="icon-box">
            <UserPlus className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Nueva Cuenta</h3>
        </div>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Role toggle */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-faint uppercase tracking-widest ml-1">
              Tipo de Cuenta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdminRole(UserRole.ADMIN)}
                className={cn(
                  'py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2',
                  adminRole === UserRole.ADMIN
                    ? 'bg-primary border-primary text-primary-fg'
                    : 'bg-surface border-border-faint text-faint hover:bg-surface-hover',
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
                    ? 'bg-primary border-primary text-primary-fg'
                    : 'bg-surface border-border-faint text-faint hover:bg-surface-hover',
                )}
              >
                <Briefcase className="w-3 h-3" />
                <span>Conta</span>
              </button>
            </div>
          </div>

          <Input
            label="Nombre Completo"
            type="text"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />

          <Input
            label="Contraseña Temporal"
            type="password"
            value={adminPassword}
            onChange={e => setAdminPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Key className="w-4 h-4" />}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            icon={<Plus className="h-4 w-4" />}
            iconRight={<ArrowRight className="w-4 h-4 opacity-50" />}
          >
            Crear Cuenta
          </Button>
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
