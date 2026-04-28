import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Monitor, Users, GraduationCap, Briefcase, Building2, Calculator, UserCheck, UserX, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { User, UserRole, Department } from '../../types';
import { useSuperAdminData, type SortField, type SortDir, type ActiveFilter } from '../../hooks/useSuperAdminData';
import { useDebounce } from '../../hooks/useDebounce';
import { Modal, Input, Button } from '../../components/ui';
import DashboardCard from '../../components/DashboardCard';
import SuperAdminAccountList from './SuperAdminAccountList';
import SuperAdminStudentHelp from './SuperAdminStudentHelp';
import SuperAdminCreateForm from './SuperAdminCreateForm';
import SuperAdminDepartmentList from './SuperAdminDepartmentList';

interface SuperAdminPortalProps {
  user: User;
  onLogout: () => void;
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  onActivateKiosk: (identifier: string, password: string, departmentId: string) => Promise<{ ok: boolean; error?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<void> | void;
  toggleUserActive: (userId: string, isActive: boolean) => Promise<void> | void;
  addDepartment: (newDepartment: Omit<Department, 'id'>) => Promise<void> | void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => Promise<void> | void;
  deleteDepartment: (deptId: string) => Promise<void> | void;
}

const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  user,
  onLogout,
  allUsers,
  allDepartments,
  addUser,
  onActivateKiosk,
  resetUserPassword,
  toggleUserActive,
  addDepartment,
  updateDepartment,
  deleteDepartment,
}) => {
  // Kiosk remote-enable state
  const [kioskDeptId, setKioskDeptId]   = useState('');
  const [kioskId, setKioskId]           = useState('');
  const [kioskPass, setKioskPass]       = useState('');
  const [kioskError, setKioskError]     = useState<string | null>(null);
  const [kioskOpen, setKioskOpen]       = useState(false);

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
  const [adminCarnet, setAdminCarnet] = useState('');
  const [adminEmployeeNumber, setAdminEmployeeNumber] = useState('');
  const [adminDepartmentId, setAdminDepartmentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');

  // ── Sorting / filtering state ──────────────────────────────────────────
  const [adminSort, setAdminSort] = useState<SortField>('createdAt');
  const [adminSortDir, setAdminSortDir] = useState<SortDir>('desc');
  const [adminActiveFilter, setAdminActiveFilter] = useState<ActiveFilter>('all');
  const [studentSort, setStudentSort] = useState<SortField>('name');
  const [studentSortDir, setStudentSortDir] = useState<SortDir>('asc');
  const [studentActiveFilter, setStudentActiveFilter] = useState<ActiveFilter>('all');

  // ── Detail modal state ─────────────────────────────────────────────────
  const [detailUser, setDetailUser] = useState<User | null>(null);

  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // ── Toggle active confirmation ─────────────────────────────────────────
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const handleConfirmToggle = async () => {
    if (!toggleTarget || isToggling) return;
    const newActive = toggleTarget.isActive === false;
    try {
      setIsToggling(true);
      await toggleUserActive(toggleTarget.id, newActive);
      toast.success(`${toggleTarget.name} ${newActive ? 'activado' : 'desactivado'}.`);
      setToggleTarget(null);
    } catch {
      // useUsers already shows the error toast
    } finally {
      setIsToggling(false);
    }
  };
  const debouncedAdminSearch = useDebounce(adminSearch);
  const debouncedStudentSearch = useDebounce(studentSearch);

  const { filteredAdmins, filteredStudents, counts } = useSuperAdminData({
    allUsers,
    adminSearch: debouncedAdminSearch,
    studentSearch: debouncedStudentSearch,
    adminSort,
    adminSortDir,
    adminActiveFilter,
    studentSort,
    studentSortDir,
    studentActiveFilter,
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
    if (adminRole === UserRole.STUDENT && !adminCarnet.trim()) {
      toast.error('El carnet es requerido para estudiantes.');
      return;
    }
    if (adminRole === UserRole.DEPT_HEAD && !adminEmployeeNumber.trim()) {
      toast.error('El número de empleado es requerido para jefes de departamento.');
      return;
    }

    try {
      const newUser: Omit<User, 'id'> = { name: adminName, role: adminRole };
      if (adminCarnet.trim()) newUser.carnet = adminCarnet.trim();
      if (adminEmployeeNumber.trim()) newUser.employeeNumber = adminEmployeeNumber.trim();
      if (adminDepartmentId) newUser.departmentId = adminDepartmentId;
      await addUser(newUser, adminPassword);
      const loginIdentifier = adminCarnet.trim() || adminEmployeeNumber.trim() || adminName.trim().toLowerCase().replace(/\s+/g, '-');
      setAdminName('');
      setAdminPassword('');
      setAdminCarnet('');
      setAdminEmployeeNumber('');
      setAdminDepartmentId('');
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

        {/* ── Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-10">
          <DashboardCard title="Total Perfiles" value={counts.total} icon={<Users className="w-4 h-4" />} subtitle="Todos los usuarios" />
          <DashboardCard title="Estudiantes" value={counts.students} icon={<GraduationCap className="w-4 h-4" />} subtitle={counts.total ? `${Math.round((counts.students / counts.total) * 100)}% del total` : undefined} />
          <DashboardCard title="Administradores" value={counts.admins} icon={<Briefcase className="w-4 h-4" />} subtitle={counts.total ? `${Math.round((counts.admins / counts.total) * 100)}% del total` : undefined} />
          <DashboardCard title="Jefes Depto" value={counts.deptHeads} icon={<Building2 className="w-4 h-4" />} subtitle={counts.total ? `${Math.round((counts.deptHeads / counts.total) * 100)}% del total` : undefined} />
          <DashboardCard title="Contabilidad" value={counts.accounting} icon={<Calculator className="w-4 h-4" />} subtitle={counts.total ? `${Math.round((counts.accounting / counts.total) * 100)}% del total` : undefined} />
          <DashboardCard title="Departamentos" value={allDepartments.length} icon={<Building2 className="w-4 h-4" />} subtitle={`${allDepartments.filter(d => d.headId).length} con jefe`} />
          <DashboardCard title="Activos" value={counts.active} icon={<UserCheck className="w-4 h-4" />} subtitle={counts.total ? `${Math.round((counts.active / counts.total) * 100)}% del total` : undefined} />
          <DashboardCard title="Inactivos" value={counts.inactive} icon={<UserX className="w-4 h-4" />} subtitle={counts.inactive === 0 ? 'Óptimo' : `${counts.inactive} requieren atención`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <SuperAdminAccountList
              filteredAdmins={filteredAdmins}
              adminSearch={adminSearch}
              setAdminSearch={setAdminSearch}
              onResetPassword={handleOpenResetPassword}
              onToggleActive={setToggleTarget}
              sortField={adminSort}
              setSortField={setAdminSort}
              sortDir={adminSortDir}
              setSortDir={setAdminSortDir}
              activeFilter={adminActiveFilter}
              setActiveFilter={setAdminActiveFilter}
              onViewDetail={setDetailUser}
              allDepartments={allDepartments}
            />
            <SuperAdminStudentHelp
              filteredStudents={filteredStudents}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              onResetPassword={handleOpenResetPassword}
              onToggleActive={setToggleTarget}
              sortField={studentSort}
              setSortField={setStudentSort}
              sortDir={studentSortDir}
              setSortDir={setStudentSortDir}
              activeFilter={studentActiveFilter}
              setActiveFilter={setStudentActiveFilter}
              onViewDetail={setDetailUser}
              allDepartments={allDepartments}
            />
            <SuperAdminDepartmentList
              allDepartments={allDepartments}
              allUsers={allUsers}
              addDepartment={addDepartment}
              updateDepartment={updateDepartment}
              deleteDepartment={deleteDepartment}
            />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Remote Kiosk Activation – Collapsible */}
            <div className="bg-card rounded-[2rem] border border-border-faint shadow-sm">
              <button
                type="button"
                onClick={() => setKioskOpen(o => !o)}
                className="w-full flex items-center justify-between p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Monitor className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-bold text-foreground">Activar kiosco remoto</h3>
                    <p className="text-xs text-faint">Activa el kiosco de un departamento a distancia</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${kioskOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {kioskOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleRemoteKiosk} className="flex flex-col gap-3 px-6 pb-6">
                      <select
                        value={kioskDeptId}
                        onChange={e => { setKioskDeptId(e.target.value); setKioskError(null); }}
                        className="w-full px-4 py-3 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      >
                        <option value="">— Selecciona un departamento —</option>
                        {allDepartments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <SuperAdminCreateForm
              adminName={adminName}
              setAdminName={setAdminName}
              adminRole={adminRole}
              setAdminRole={setAdminRole}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              adminCarnet={adminCarnet}
              setAdminCarnet={setAdminCarnet}
              adminEmployeeNumber={adminEmployeeNumber}
              setAdminEmployeeNumber={setAdminEmployeeNumber}
              adminDepartmentId={adminDepartmentId}
              setAdminDepartmentId={setAdminDepartmentId}
              allDepartments={allDepartments}
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

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="Detalle de usuario"
        subtitle={detailUser?.name ?? ''}
      >
        {detailUser && (
          <div className="space-y-3 text-sm">
            <Row label="Nombre" value={detailUser.name} />
            <Row label="Rol" value={detailUser.role.replace('_', ' ')} />
            {detailUser.carnet && <Row label="Carnet" value={detailUser.carnet} />}
            {detailUser.employeeNumber && <Row label="No. Empleado" value={detailUser.employeeNumber} />}
            {detailUser.institutionalEmail && <Row label="Email institucional" value={detailUser.institutionalEmail} />}
            {detailUser.departmentId && (
              <Row label="Departamento" value={allDepartments.find(d => d.id === detailUser.departmentId)?.name ?? detailUser.departmentId} />
            )}
            <Row label="Estado" value={detailUser.isActive !== false ? 'Activo' : 'Inactivo'} />
            {detailUser.createdAt && (
              <Row label="Creado" value={new Date(detailUser.createdAt).toLocaleDateString('es-HN', { year: 'numeric', month: 'long', day: 'numeric' })} />
            )}
            <div className="pt-3">
              <Button
                variant={detailUser.isActive !== false ? 'danger' : 'primary'}
                size="sm"
                onClick={() => { setDetailUser(null); setToggleTarget(detailUser); }}
                className="w-full"
              >
                {detailUser.isActive !== false ? 'Desactivar usuario' : 'Activar usuario'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Toggle Active Confirmation Modal ─────────────────────────────── */}
      <Modal
        open={!!toggleTarget}
        onClose={() => { if (!isToggling) setToggleTarget(null); }}
        title={toggleTarget?.isActive !== false ? 'Desactivar usuario' : 'Activar usuario'}
        subtitle={toggleTarget?.name ?? ''}
      >
        <div className="space-y-5">
          <p className="text-sm text-muted">
            {toggleTarget?.isActive !== false
              ? `¿Estás seguro de desactivar a ${toggleTarget?.name}? No podrá iniciar sesión hasta ser reactivado.`
              : `¿Reactivar a ${toggleTarget?.name}? Podrá iniciar sesión nuevamente.`}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="ghost"
              disabled={isToggling}
              onClick={() => setToggleTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              variant={toggleTarget?.isActive !== false ? 'danger' : 'primary'}
              disabled={isToggling}
              onClick={handleConfirmToggle}
            >
              {isToggling ? 'Procesando...' : toggleTarget?.isActive !== false ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between border-b border-border-faint pb-2">
    <span className="text-muted font-medium">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);

export default SuperAdminPortal;
