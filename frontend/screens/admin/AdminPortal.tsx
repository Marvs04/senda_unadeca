import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { LayoutDashboard, GraduationCap, Users, Building, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { User, WorkLog, Department } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { getBillingCycle } from '../../lib/business';
import { PortalLayout } from '../../components/layout';
import { TabBar, Modal, Input, Button } from '../../components/ui';
import type { Tab } from '../../components/ui';
import { useAdminRateUpdate } from '../../hooks/useAdminRateUpdate';
import AdminDashboardTab from './AdminDashboardTab';
import AdminStudentsTab from './AdminStudentsTab';
import AdminDeptHeadsTab from './AdminDeptHeadsTab';
import AdminDepartmentsTab from './AdminDepartmentsTab';

interface AdminPortalProps {
  user: User;
  onLogout: () => void;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  deleteUser: (userId: string) => Promise<void> | void;
  addDepartment: (newDepartment: Omit<Department, 'id'>) => Promise<void> | void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void> | void;
  currentRate: number;
  setCurrentRate: (rate: number) => void;
}

type TabId = 'dashboard' | 'students' | 'dept-heads' | 'departments';

const TABS: Tab<TabId>[] = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'students',     label: 'Estudiantes',    icon: GraduationCap },
  { id: 'dept-heads',   label: 'Jefes Depto.',   icon: Users },
  { id: 'departments',  label: 'Departamentos',  icon: Building },
];

const AdminPortal: React.FC<AdminPortalProps> = ({
  user, onLogout,
  allLogs, allUsers, allDepartments,
  addUser, deleteUser, addDepartment, updateDepartment, updateUser,
  currentRate, setCurrentRate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedCycle, setSelectedCycle] = useState(getBillingCycle().value);

  const {
    isOpen: isUpdatingRate,
    open: openRateModal,
    close: closeRateModal,
    ratePassword,
    setRatePassword,
    newRateValue,
    setNewRateValue,
    handleSubmit: handleRateUpdate,
  } = useAdminRateUpdate({ currentRate, onRateUpdated: setCurrentRate });

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-background selection:bg-surface-hover">
      {/* Top bar: tabs + controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)} />

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
            onClick={openRateModal}
          >
            Tarifa: {formatCurrency(currentRate)}
          </Button>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <select
              value={selectedCycle}
              onChange={e => setSelectedCycle(e.target.value)}
              className="select-custom pl-10 pr-10"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const cycle = getBillingCycle(d);
                return <option key={cycle.value} value={cycle.value}>{cycle.label}</option>;
              })}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <AdminDashboardTab
            user={user}
            allLogs={allLogs} allUsers={allUsers} allDepartments={allDepartments}
            selectedCycle={selectedCycle} currentRate={currentRate}
          />
        )}
        {activeTab === 'students' && (
          <AdminStudentsTab
            allUsers={allUsers} allDepartments={allDepartments}
            addUser={addUser} updateUser={updateUser} deleteUser={deleteUser}
          />
        )}
        {activeTab === 'dept-heads' && (
          <AdminDeptHeadsTab
            allUsers={allUsers} allDepartments={allDepartments}
            addUser={addUser} updateUser={updateUser} deleteUser={deleteUser}
          />
        )}
        {activeTab === 'departments' && (
          <AdminDepartmentsTab
            allDepartments={allDepartments} allUsers={allUsers} allLogs={allLogs}
            selectedCycle={selectedCycle}
            addDepartment={addDepartment} updateDepartment={updateDepartment}
          />
        )}
      </AnimatePresence>

      {/* Update Rate Modal */}
      <Modal
        open={isUpdatingRate}
        onClose={closeRateModal}
        title="Actualizar Tarifa"
        subtitle="Se requiere autorización para cambiar la tarifa global."
      >
        <form onSubmit={handleRateUpdate} className="space-y-5">
          <Input
            label="Nueva Tarifa (CRC)"
            type="number"
            value={newRateValue}
            onChange={e => setNewRateValue(e.target.value)}
            placeholder="1500"
            autoFocus
          />
          <Input
            label="Contraseña de Admin"
            type="password"
            value={ratePassword}
            onChange={e => setRatePassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={closeRateModal}>
              Cancelar
            </Button>
            <Button type="submit" variant="success">
              Actualizar
            </Button>
          </div>
        </form>
      </Modal>
    </PortalLayout>
  );
};

export default AdminPortal;
