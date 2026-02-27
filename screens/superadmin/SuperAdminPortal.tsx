import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../../components/Header';
import { User, UserRole } from '../../types';
import { useConfirm } from '../../hooks/useConfirm';
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

  const adminUsers = useMemo(
    () =>
      (allUsers || []).filter(
        u =>
          u.role === UserRole.ADMIN ||
          u.role === UserRole.ACCOUNTING ||
          u.role === UserRole.DEPT_HEAD,
      ),
    [allUsers],
  );

  const filteredAdmins = useMemo(
    () =>
      adminUsers.filter(
        a =>
          (a.name || '').toLowerCase().includes(adminSearch.toLowerCase()) ||
          a.employeeNumber?.toLowerCase().includes(adminSearch.toLowerCase()),
      ),
    [adminUsers, adminSearch],
  );

  const students = useMemo(
    () => (allUsers || []).filter(u => u.role === UserRole.STUDENT),
    [allUsers],
  );

  const filteredStudents = useMemo(
    () =>
      students.filter(
        s =>
          (s.name || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
          s.carnet?.includes(studentSearch),
      ),
    [students, studentSearch],
  );

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
    <div className="min-h-screen bg-zinc-50 selection:bg-zinc-900 selection:text-white">
      <Toaster position="top-right" richColors />
      <Header user={user} onLogout={onLogout} />

      <main className="page-container py-10">
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
      </main>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default SuperAdminPortal;
