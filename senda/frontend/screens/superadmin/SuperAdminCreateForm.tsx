import React from 'react';
import {
  ShieldCheck,
  Key,
  Plus,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Briefcase,
  GraduationCap,
  Building2,
  Calculator,
} from 'lucide-react';
import { UserRole, Department } from '../../types';
import { cn } from '../../lib/utils';
import { Input, Button } from '../../components/ui';

const ROLE_OPTIONS: { role: UserRole; label: string; icon: React.ReactNode }[] = [
  { role: UserRole.ADMIN,      label: 'Admin',     icon: <ShieldCheck className="w-3 h-3" /> },
  { role: UserRole.ACCOUNTING, label: 'Conta',     icon: <Calculator className="w-3 h-3" /> },
  { role: UserRole.DEPT_HEAD,  label: 'Jefe Depto', icon: <Building2 className="w-3 h-3" /> },
  { role: UserRole.STUDENT,    label: 'Estudiante', icon: <GraduationCap className="w-3 h-3" /> },
  { role: UserRole.SUPER_ADMIN, label: 'Super Admin', icon: <Briefcase className="w-3 h-3" /> },
];

interface SuperAdminCreateFormProps {
  adminName: string;
  setAdminName: (v: string) => void;
  adminRole: UserRole;
  setAdminRole: (v: UserRole) => void;
  adminPassword: string;
  setAdminPassword: (v: string) => void;
  adminCarnet: string;
  setAdminCarnet: (v: string) => void;
  adminEmployeeNumber: string;
  setAdminEmployeeNumber: (v: string) => void;
  adminInstitutionalEmail: string;
  setAdminInstitutionalEmail: (v: string) => void;
  adminDepartmentId: string;
  setAdminDepartmentId: (v: string) => void;
  allDepartments: Department[];
  onSubmit: (e: React.FormEvent) => void;
}

const SuperAdminCreateForm: React.FC<SuperAdminCreateFormProps> = ({
  adminName,
  setAdminName,
  adminRole,
  setAdminRole,
  adminPassword,
  setAdminPassword,
  adminCarnet,
  setAdminCarnet,
  adminEmployeeNumber,
  setAdminEmployeeNumber,
  adminInstitutionalEmail,
  setAdminInstitutionalEmail,
  adminDepartmentId,
  setAdminDepartmentId,
  allDepartments,
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
              {ROLE_OPTIONS.map(({ role, label, icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAdminRole(role)}
                  className={cn(
                    'py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center justify-center space-x-2',
                    adminRole === role
                      ? 'bg-primary border-primary text-primary-fg'
                      : 'bg-surface border-border-faint text-faint hover:bg-surface-hover',
                  )}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Nombre Completo"
            type="text"
            value={adminName}
            onChange={e => setAdminName(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />

          {/* Conditional: STUDENT needs carnet */}
          {adminRole === UserRole.STUDENT && (
            <Input
              label="Carnet *"
              type="text"
              value={adminCarnet}
              onChange={e => setAdminCarnet(e.target.value)}
              placeholder="Ej. 11911088"
            />
          )}

          {/* Conditional: DEPT_HEAD needs employeeNumber */}
          {adminRole === UserRole.DEPT_HEAD && (
            <Input
              label="No. de Empleado *"
              type="text"
              value={adminEmployeeNumber}
              onChange={e => setAdminEmployeeNumber(e.target.value)}
              placeholder="Ej. EMP-001"
            />
          )}

          {/* Optional: Department select (useful for DEPT_HEAD and STUDENT) */}
          {(adminRole === UserRole.DEPT_HEAD || adminRole === UserRole.STUDENT) && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-faint uppercase tracking-widest ml-1">
                Departamento
              </label>
              <select
                value={adminDepartmentId}
                onChange={e => setAdminDepartmentId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
              >
                <option value="">— Sin asignar —</option>
                {allDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Correo Institucional *"
            type="email"
            value={adminInstitutionalEmail}
            onChange={e => setAdminInstitutionalEmail(e.target.value)}
            placeholder="usuario@unadeca.net"
            required
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
