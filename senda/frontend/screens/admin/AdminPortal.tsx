import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { LayoutDashboard, GraduationCap, Users, Building, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { User, WorkLog, Department } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { getBillingCycle } from '../../lib/business';
import { PortalLayout } from '../../components/layout';
import { Modal, Input, Button } from '../../components/ui';
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
  deleteDepartment: (deptId: string) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void> | void;
  currentRate: number;
  setCurrentRate: (rate: number) => void;
}

type TabId = 'dashboard' | 'students' | 'dept-heads' | 'departments';

const SIDEBAR_ITEMS: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'students',     label: 'Estudiantes',    icon: GraduationCap },
  { id: 'dept-heads',   label: 'Jefes Depto.',   icon: Users },
  { id: 'departments',  label: 'Departamentos',  icon: Building },
];

const AdminPortal: React.FC<AdminPortalProps> = ({
  user, onLogout,
  allLogs, allUsers, allDepartments,
  addUser, deleteUser, addDepartment, updateDepartment, deleteDepartment, updateUser,
  currentRate, setCurrentRate,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedCycle, setSelectedCycle] = useState(getBillingCycle().value);

  const {
    isOpen: isUpdatingRate,
    open: openRateModal,
    close: closeRateModal,
    newRateValue,
    setNewRateValue,
    handleSubmit: handleRateUpdate,
  } = useAdminRateUpdate({ currentRate, onRateUpdated: setCurrentRate });

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-background selection:bg-surface-hover">
      <div className="flex gap-8">
        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="hidden md:flex flex-col w-[200px] shrink-0 sticky top-24 self-start">
          <nav className="space-y-1 mb-6">
            {SIDEBAR_ITEMS.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all',
                    active
                      ? 'bg-[#1d3261] text-white shadow-lg shadow-[#1d3261]/20'
                      : 'text-muted hover:bg-surface hover:text-foreground',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-border-faint pt-4 space-y-3">
            <Button
              variant="outline"
              size="sm"
              icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
              onClick={openRateModal}
              className="w-full justify-start"
            >
              {formatCurrency(currentRate)}/h
            </Button>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <select
                value={selectedCycle}
                onChange={e => setSelectedCycle(e.target.value)}
                className="select-custom w-full pl-10 pr-8 text-xs"
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
        </aside>

        {/* ── Mobile tabs (compact) ───────────────────────────── */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-4 mb-2 w-full">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-medium whitespace-nowrap transition-all shrink-0',
                  active
                    ? 'bg-[#1d3261] text-white shadow-lg shadow-[#1d3261]/20'
                    : 'bg-surface text-muted',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
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
                addDepartment={addDepartment} updateDepartment={updateDepartment} deleteDepartment={deleteDepartment}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Update Rate Modal */}
      <Modal
        open={isUpdatingRate}
        onClose={closeRateModal}
        title="Actualizar Tarifa"
        subtitle="Solo cuentas con permisos administrativos pueden aplicar este cambio."
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
