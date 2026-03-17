import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { User, UserRole } from '../../types';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal, Input, Button } from '../../components/ui';
import SuperAdminAccountList from './SuperAdminAccountList';
import SuperAdminStudentHelp from './SuperAdminStudentHelp';
import SuperAdminCreateForm from './SuperAdminCreateForm';

interface SuperAdminPortalProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  onActivateKiosk: (identifier: string, password: string, departmentId: string) => Promise<{ ok: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void> | void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  user,
  onLogout,
  allUsers,
  addUser,
  onActivateKiosk,
  resetUserPassword,
}) => {
  // Kiosk remote-enable state
  const [kioskDeptId, setKioskDeptId]   = useState('');
  const [kioskId, setKioskId]           = useState('');
  const [kioskPass, setKioskPass]       = useState('');
  const [kioskError, setKioskError]     = useState<string | null>(null);

  const handleRemoteKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onActivateKiosk(kioskId.trim(), kioskPass.trim(), kioskDeptId.trim());
    if (!result.ok) { setKioskError(result.error ?? 'Error.'); return; }
    setKioskError(null);
    setKioskId('');
    setKioskPass('');
    toast.success('Kiosco activado remotamente.');
  };

  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState<UserRole>(UserRole.ADMIN);
  const [adminPassword, setAdminPassword] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const debouncedAdminSearch = useDebounce(adminSearch);
  const debouncedStudentSearch = useDebounce(studentSearch);

  const { filteredAdmins, filteredStudents } = useSuperAdminData({
    allUsers,
    adminSearch: debouncedAdminSearch,
    studentSearch: debouncedStudentSearch,
  });

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName) {
      toast.error('Por favor ingrese el nombre.');
      return;
    }
    if (!adminPassword.trim()) {
      toast.error('Debes ingresar una contraseña temporal.');
      return;
    }

    try {
      await addUser({ name: adminName, role: adminRole }, adminPassword);
      const loginIdentifier = adminName.trim().toLowerCase().replace(/\s+/g, '-');
      setAdminName('');
      setAdminPassword('');
      toast.success(`Cuenta creada. Login: ${loginIdentifier} | Clave: ${adminPassword}`);
    } catch {
      // El hook useUsers ya maneja y muestra el error exacto del backend.
    }
  };

  const handleOpenResetPassword = (target: User) => {
    setResetTarget(target);
    setNewPassword('');
  };

  const handleSubmitResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetTarget || isResetting) return;

    const trimmedPassword = newPassword.trim();
    if (trimmedPassword.length < 8) {
      toast.error('La contraseña temporal debe tener al menos 8 caracteres.');
      return;
    }

    try {
      setIsResetting(true);
      await resetUserPassword(resetTarget.id, trimmedPassword);
      toast.success(`Contraseña reseteada para ${resetTarget.name}.`);
      setResetTarget(null);
      setNewPassword('');
    } catch {
      // El hook useUsers expone el error exacto del backend.
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-background selection:bg-surface-hover">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary text-primary-fg rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
              Super Administración
            </h2>
          </div>
          <p className="text-muted text-sm">
            Control total del sistema y gestión de privilegios administrativos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SuperAdminAccountList
              filteredAdmins={filteredAdmins}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              onResetPassword={handleOpenResetPassword}
            />
            <SuperAdminStudentHelp
              filteredStudents={filteredStudents}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              onResetPassword={handleOpenResetPassword}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Remote Kiosk Activation */}
            <div className="bg-card rounded-[2rem] border border-border-faint shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Activar kiosco remoto</h3>
                  <p className="text-xs text-faint">Activa el kiosco de un departamento a distancia</p>
                </div>
              </div>
              <form onSubmit={handleRemoteKiosk} className="flex flex-col gap-3">
                <input type="text" placeholder="ID del departamento"
                  value={kioskDeptId} onChange={e => { setKioskDeptId(e.target.value); setKioskError(null); }}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="text" placeholder="Número de empleado (Super Admin)"
                  value={kioskId} onChange={e => { setKioskId(e.target.value); setKioskError(null); }}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                <input type="password" placeholder="Contraseña"
                  value={kioskPass} onChange={e => { setKioskPass(e.target.value); setKioskError(null); }}
                  className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                {kioskError && <p className="text-xs text-rose-500">{kioskError}</p>}
                <button type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">
                  Activar kiosco
                </button>
              </form>
            </div>
            <SuperAdminCreateForm
              adminName={adminName}
              setAdminName={setAdminName}
              adminRole={adminRole}
              setAdminRole={setAdminRole}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              onSubmit={handleAddAdmin}
            />
          </div>
        </div>

      <Modal
        open={!!resetTarget}
        onClose={() => {
          if (isResetting) return;
          setResetTarget(null);
          setNewPassword('');
        }}
        title="Resetear contraseña"
        subtitle={resetTarget ? `Define una nueva contraseña temporal para ${resetTarget.name}.` : ''}
      >
        <form onSubmit={handleSubmitResetPassword} className="space-y-5">
          <Input
            label="Nueva contraseña temporal"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              disabled={isResetting}
              onClick={() => {
                setResetTarget(null);
                setNewPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={isResetting}>
              {isResetting ? 'Guardando...' : 'Resetear'}
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
};

export default SuperAdminPortal;
