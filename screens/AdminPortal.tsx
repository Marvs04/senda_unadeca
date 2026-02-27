import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Building, 
  LayoutDashboard, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  ShieldCheck,
  UserMinus,
  ArrowRightLeft,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  DollarSign,
  Calendar,
  Zap,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { toast, Toaster } from 'sonner';
import Header from '../components/Header';
import DashboardCard from '../components/DashboardCard';
import WorkLogTable from '../components/WorkLogTable';
import { User, WorkLog, UserRole, Department, WorkLogStatus } from '../types';
import { cn, exportToCSV, exportToPDF, formatCurrency, getBillingCycle, isDateInCycle } from '../lib/utils';

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

const AdminPortal: React.FC<AdminPortalProps> = ({ 
  user, 
  onLogout, 
  allLogs, 
  allUsers, 
  allDepartments, 
  addUser, 
  deleteUser,
  addDepartment, 
  updateDepartment,
  updateUser,
  currentRate,
  setCurrentRate
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'dept-heads' | 'departments'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAddingDeptHead, setIsAddingDeptHead] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHeadId, setNewDeptHeadId] = useState('');
  
  // Student Management State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [selectedCycle, setSelectedCycle] = useState(getBillingCycle().value);

  const stats = useMemo(() => {
    const cycleLogs = (allLogs || []).filter(log => isDateInCycle(log.date, selectedCycle));
    const totalHours = cycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const totalGlobalPayment = totalHours * currentRate;
    const activeStudents = (allUsers || []).filter(u => u.role === UserRole.STUDENT).length;
    
    // Chart Data: Hours per department
    const deptMap = cycleLogs.reduce((acc, log) => {
        const deptName = (allDepartments || []).find(d => d.id === log.departmentId)?.name || 'N/A';
        acc[deptName] = (acc[deptName] || 0) + log.hours;
        return acc;
    }, {} as any);
    const deptChartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Chart Data: Top 5 students
    const studentMap = cycleLogs.reduce((acc, log) => {
        const studentName = (allUsers || []).find(u => u.id === log.studentId)?.name?.split(' ')[0] || 'N/A';
        acc[studentName] = (acc[studentName] || 0) + log.hours;
        return acc;
    }, {} as any);
    const studentChartData = Object.entries(studentMap)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, hours]) => ({ name, hours }));

    return { totalHours, totalGlobalPayment, activeStudents, deptChartData, studentChartData };
  }, [allLogs, allUsers, allDepartments, selectedCycle, currentRate]);

  const filteredStudents = useMemo(() => {
    return (allUsers || []).filter(u => 
      u.role === UserRole.STUDENT && 
      ((u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
       u.carnet?.includes(searchTerm))
    );
  }, [allUsers, searchTerm]);

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Departamento', 'Fecha', 'Horas', 'Estado'];
    const rows = (allLogs || []).map(log => [
        (allUsers || []).find(u => u.id === log.studentId)?.name || 'N/A',
        (allDepartments || []).find(d => d.id === log.departmentId)?.name || 'N/A',
        log.date,
        log.hours,
        log.status
    ]);

    if (type === 'csv') {
        exportToCSV('reporte_general.csv', headers, rows);
    } else {
        exportToPDF('reporte_general.pdf', 'Reporte General de Horas Beca', headers, rows);
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  const handleUpdateStudentDept = (studentId: string, deptId: string | undefined) => {
    if (window.confirm('¿Confirmas que deseas cambiar el departamento de este estudiante?')) {
        if (updateUser) {
            updateUser(studentId, { departmentId: deptId });
            toast.success('Departamento actualizado correctamente', { position: 'top-center' });
            setEditingStudent(null);
        }
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    addDepartment({ name: newDeptName, headId: newDeptHeadId || undefined });
    setNewDeptName('');
    setNewDeptHeadId('');
    setIsAddingDept(false);
    toast.success('Departamento creado exitosamente', { position: 'top-center' });
  };

  const handleEditDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept || !newDeptName.trim()) return;
    updateDepartment(editingDept.id, { name: newDeptName, headId: newDeptHeadId || undefined });
    setEditingDept(null);
    setNewDeptName('');
    setNewDeptHeadId('');
    toast.success('Departamento actualizado exitosamente', { position: 'top-center' });
  };

  const handleAddDeptHead = (e: React.FormEvent) => {
    e.preventDefault();
    const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
    const employeeNumber = (e.currentTarget.elements.namedItem('employeeNumber') as HTMLInputElement).value;
    const departmentId = (e.currentTarget.elements.namedItem('departmentId') as HTMLSelectElement).value;

    if (!name || !employeeNumber) {
        toast.error('Por favor complete todos los campos');
        return;
    }

    addUser({
        name,
        employeeNumber,
        departmentId: departmentId || undefined,
        role: UserRole.DEPT_HEAD
    });

    setIsAddingDeptHead(false);
    toast.success('Jefe de Departamento creado exitosamente');
  };

  const handleDeleteDeptHead = (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cuenta de Jefe de Departamento?')) {
        deleteUser(id);
        toast.success('Cuenta eliminada correctamente');
    }
  };

  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [ratePassword, setRatePassword] = useState('');
  const [newRateValue, setNewRateValue] = useState(currentRate.toString());

  const handleRateUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication: password is "admin123"
    if (ratePassword !== 'admin123') {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-2xl w-fit">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'students', label: 'Estudiantes', icon: GraduationCap },
                    { id: 'dept-heads', label: 'Jefes Depto.', icon: Users },
                    { id: 'departments', label: 'Departamentos', icon: Building },
                ].map((tab) => (
                    <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all",
                        activeTab === tab.id 
                        ? "bg-white text-zinc-900 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
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
                        {Array.from({length: 6}, (_, i) => {
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

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <DashboardCard title="Horas Ciclo" value={stats.totalHours.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
                <DashboardCard title="Estudiantes Activos" value={stats.activeStudents} icon={<Users className="h-5 w-5" />} />
                <DashboardCard title="Total Pago Global" value={formatCurrency(stats.totalGlobalPayment)} icon={<DollarSign className="h-5 w-5 text-emerald-500" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-zinc-100 rounded-xl">
                            <BarChart3 className="w-4 h-4 text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Horas por Estudiante (Top 5)</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.studentChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} />
                                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="hours" fill="#18181b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-zinc-100 rounded-xl">
                            <PieChartIcon className="w-4 h-4 text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Distribución por Depto.</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={stats.deptChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {stats.deptChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={['#18181b', '#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-zinc-100 rounded-2xl">
                      <FileText className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold tracking-tight">Registros Globales</h3>
                      <p className="text-xs text-zinc-400">Vista consolidada del ciclo seleccionado</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleExport('csv')} className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleExport('pdf')} className="px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-all flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>Exportar PDF</span>
                    </button>
                  </div>
                </div>
                <div className="p-2">
                  <WorkLogTable logs={allLogs.filter(l => isDateInCycle(l.date, selectedCycle))} users={allUsers} departments={allDepartments} title="" showStudent showDepartment />
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'students' && (
            <motion.div 
              key="students"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o carnet..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingStudent(true)}
                  className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Estudiante</span>
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                    <tr>
                      <th className="px-8 py-5">Estudiante</th>
                      <th className="px-8 py-5">Carnet</th>
                      <th className="px-8 py-5">Departamento</th>
                      <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-zinc-50 transition-colors group">
                        <td className="px-8 py-5 font-medium text-sm">{student.name}</td>
                        <td className="px-8 py-5 text-sm text-zinc-500 font-mono">{student.carnet || '---'}</td>
                        <td className="px-8 py-5">
                          <span className="px-3 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-600">
                            {allDepartments.find(d => d.id === student.departmentId)?.name || 'Sin Asignar'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                                onClick={() => setEditingStudent(student)}
                                className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                                title="Cambiar Departamento"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => handleUpdateStudentDept(student.id, undefined)}
                                className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Quitar de Departamento"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'dept-heads' && (
            <motion.div 
              key="dept-heads"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
                <div className="flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar jefe de departamento..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-zinc-100 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddingDeptHead(true)}
                        className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Jefe Depto.</span>
                    </button>
                </div>

                <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                            <tr>
                                <th className="px-8 py-5">Nombre</th>
                                <th className="px-8 py-5">Nº Empleado</th>
                                <th className="px-8 py-5">Departamento</th>
                                <th className="px-8 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {(allUsers || []).filter(u => u.role === UserRole.DEPT_HEAD && (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())).map((head) => (
                                <tr key={head.id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-8 py-5 font-medium text-sm">{head.name}</td>
                                    <td className="px-8 py-5 text-sm text-zinc-500 font-mono">{head.employeeNumber || '---'}</td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-600">
                                            {(allDepartments || []).find(d => d.id === head.departmentId)?.name || 'Sin Asignar'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button 
                                            onClick={() => handleDeleteDeptHead(head.id)}
                                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Eliminar Cuenta"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
          )}

          {activeTab === 'departments' && (
            <motion.div 
              key="departments"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
                <div className="flex justify-end">
                    <button 
                        onClick={() => {
                            setEditingDept(null);
                            setNewDeptName('');
                            setNewDeptHeadId('');
                            setIsAddingDept(true);
                        }}
                        className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nuevo Departamento</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(allDepartments || []).map(dept => {
                        const deptStudents = (allUsers || []).filter(u => u.departmentId === dept.id && u.role === UserRole.STUDENT).length;
                        const deptHours = (allLogs || []).filter(l => l.departmentId === dept.id && isDateInCycle(l.date, selectedCycle)).reduce((acc, l) => acc + l.hours, 0);
                        const deptHead = (allUsers || []).find(u => u.id === dept.headId);
                        
                        return (
                            <div key={dept.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-zinc-100 rounded-2xl group-hover:bg-zinc-900 group-hover:text-white transition-all">
                                        <Building className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button 
                                            onClick={() => {
                                                setEditingDept(dept);
                                                setNewDeptName(dept.name);
                                                setNewDeptHeadId(dept.headId || '');
                                                setIsAddingDept(true);
                                            }}
                                            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold mb-1">{dept.name}</h4>
                                <p className="text-xs text-zinc-400 mb-6">Jefe: <span className="text-zinc-900 font-medium">{deptHead?.name || 'No asignado'}</span></p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Estudiantes</p>
                                        <p className="text-xl font-bold">{deptStudents}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Horas Ciclo</p>
                                        <p className="text-xl font-bold">{deptHours.toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <AnimatePresence>
            {editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold mb-2">Cambiar Departamento</h3>
                        <p className="text-sm text-zinc-500 mb-6">Selecciona el nuevo departamento para <strong>{editingStudent.name}</strong></p>
                        
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {allDepartments.map(dept => (
                                <button 
                                    key={dept.id}
                                    onClick={() => handleUpdateStudentDept(editingStudent.id, dept.id)}
                                    className="w-full p-4 text-left rounded-2xl border border-zinc-100 hover:border-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-between group"
                                >
                                    <span className="font-medium text-sm">{dept.name}</span>
                                    <ArrowRightLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => setEditingStudent(null)}
                            className="w-full mt-6 py-3 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                        >
                            Cancelar
                        </button>
                    </motion.div>
                </div>
            )}

            {isAddingDept && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold mb-6">{editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}</h3>
                        <form onSubmit={editingDept ? handleEditDept : handleAddDept} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre del Departamento</label>
                                <input 
                                    type="text" 
                                    value={newDeptName}
                                    onChange={e => setNewDeptName(e.target.value)}
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                    placeholder="Ej. Recursos Humanos"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Jefe de Departamento</label>
                                <div className="relative">
                                    <select 
                                        value={newDeptHeadId}
                                        onChange={e => setNewDeptHeadId(e.target.value)}
                                        className="select-custom w-full py-3.5 px-5 pr-10"
                                    >
                                        <option value="">Sin Asignar</option>
                                        {(allUsers || []).filter(u => u.role === UserRole.DEPT_HEAD).map(head => (
                                            <option key={head.id} value={head.id}>{head.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddingDept(false)}
                                    className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                                >
                                    {editingDept ? 'Guardar Cambios' : 'Crear Depto.'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isAddingDeptHead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        <h3 className="text-xl font-bold mb-6">Nuevo Jefe de Departamento</h3>
                        <form onSubmit={handleAddDeptHead} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                <input 
                                    name="name"
                                    type="text" 
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                    placeholder="Ej. Juan Pérez"
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nº de Empleado</label>
                                <input 
                                    name="employeeNumber"
                                    type="text" 
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                                    placeholder="Ej. EMP-123"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Departamento</label>
                                <div className="relative">
                                    <select 
                                        name="departmentId"
                                        className="select-custom w-full py-3.5 px-5 pr-10"
                                    >
                                        <option value="">Sin Asignar</option>
                                        {allDepartments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddingDeptHead(false)}
                                    className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                                >
                                    Crear Cuenta
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

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
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
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
                                    className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
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

const AlertCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

export default AdminPortal;
