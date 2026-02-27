import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, GraduationCap, Users, Building, DollarSign, Calendar, ChevronDown } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../../components/Header';
import { User, WorkLog, Department } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { getBillingCycle } from '../../lib/business';
import { ADMIN_RATE_PASSWORD } from '../../constants';
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
  addUser: (newUser: Omit<User, 'id'>) => void;
  deleteUser: (userId: string) => void;
  addDepartment: (newDepartment: Omit<Department, 'id'>) => void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  currentRate: number;
  setCurrentRate: (rate: number) => void;
}

type TabId = 'dashboard' | 'students' | 'dept-heads' | 'departments';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
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

  // Rate update modal state
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [ratePassword, setRatePassword] = useState('');
  const [newRateValue, setNewRateValue] = useState(currentRate.toString());

  const handleRateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratePassword !== ADMIN_RATE_PASSWORD) {
      toast.error('Contraseña de autorización incorrecta', { position: 'top-center' });
      return;
    }
    const val = Number(newRateValue);
    if (!isNaN(val) && val > 0) {
      setCurrentRate(val);
      toast.success(`Tarifa actualizada a ${formatCurrency(val)}`, { position: 'top-center' });
      setIsUpdatingRate(false);
      setRatePassword('');
    } else {
      toast.error('Por favor ingrese una tarifa válida', { position: 'top-center' });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 selection:bg-indigo-100">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />

      <main className="page-container py-10">
        {/* Top bar: tabs + controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-2xl w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all',
                  activeTab === tab.id
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsUpdatingRate(true)}
              className="px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold flex items-center space-x-2 hover:bg-zinc-50 transition-all"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Tarifa: {formatCurrency(currentRate)}</span>
            </button>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={selectedCycle}
                onChange={e => setSelectedCycle(e.target.value)}
                className="select-custom pl-10 pr-10"
              >
                {Array.from({ length: 6 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const cycle = getBillingCycle(d);
                  return <option key={cycle.value} value={cycle.value}>{cycle.label}</option>;
                })}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <AdminDashboardTab
              allLogs={allLogs} allUsers={allUsers} allDepartments={allDepartments}
              selectedCycle={selectedCycle} currentRate={currentRate}
            />
          )}
          {activeTab === 'students' && (
            <AdminStudentsTab
              allUsers={allUsers} allDepartments={allDepartments}
              addUser={addUser} updateUser={updateUser}
            />
          )}
          {activeTab === 'dept-heads' && (
            <AdminDeptHeadsTab
              allUsers={allUsers} allDepartments={allDepartments}
              addUser={addUser} deleteUser={deleteUser}
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
        <AnimatePresence>
          {isUpdatingRate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
              >
                <h3 className="text-xl font-bold mb-2">Actualizar Tarifa</h3>
                <p className="text-sm text-zinc-500 mb-6">Se requiere autorización para cambiar la tarifa global.</p>
                <form onSubmit={handleRateUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nueva Tarifa (CRC)</label>
                    <input
                      type="number"
                      value={newRateValue}
                      onChange={e => setNewRateValue(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                      placeholder="1500"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Contraseña de Admin</label>
                    <input
                      type="password"
                      value={ratePassword}
                      onChange={e => setRatePassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setIsUpdatingRate(false)}
                      className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                    >
                      Actualizar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminPortal;
