import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { User, UserRole } from '../../types';
import { useConfirm } from '../../hooks/useConfirm';
import { useSuperAdminData } from '../../hooks/useSuperAdminData';
import ConfirmDialog from '../../components/ConfirmDialog';
import SuperAdminAccountList from './SuperAdminAccountList';
import SuperAdminStudentHelp from './SuperAdminStudentHelp';
import SuperAdminCreateForm from './SuperAdminCreateForm';

interface SuperAdminPortalProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  addUser: (newUser: Omit<User, 'id'>) => void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  user,
  onLogout,
  allUsers,
  addUser,
}) => {
  const [adminName, setAdminName] = useState('');
  const [adminRole, setAdminRole] = useState<UserRole>(UserRole.ADMIN);
  const [adminPassword, setAdminPassword] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const { filteredAdmins, filteredStudents } = useSuperAdminData({
    allUsers,
    adminSearch,
    studentSearch,
  });

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName) {
      toast.error('Por favor ingrese el nombre.');
      return;
    }
    addUser({ name: adminName, role: adminRole });
    setAdminName('');
    setAdminPassword('');
    toast.success(`Cuenta de ${adminRole.replace('_', ' ')} creada exitosamente.`);
  };

  const handleResetPassword = async (userName: string) => {
    const ok = await confirm(
      `¿Confirmas que deseas resetear la contraseña de ${userName}?`,
      { title: 'Resetear contraseña', variant: 'danger' },
    );
    if (!ok) return;
    toast.success(`Se ha enviado un enlace de recuperación a ${userName}`);
  };

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-zinc-50 selection:bg-zinc-900 selection:text-white">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-zinc-900 text-white rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">
              Super Administración
            </h2>
          </div>
          <p className="text-zinc-500 text-sm">
            Control total del sistema y gestión de privilegios administrativos.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SuperAdminAccountList
              filteredAdmins={filteredAdmins}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              onResetPassword={handleResetPassword}
            />
            <SuperAdminStudentHelp
              filteredStudents={filteredStudents}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              onResetPassword={handleResetPassword}
            />
          </div>

          <div className="lg:col-span-4">
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
      <ConfirmDialog {...dialogProps} />
    </PortalLayout>
  );
};

export default SuperAdminPortal;
