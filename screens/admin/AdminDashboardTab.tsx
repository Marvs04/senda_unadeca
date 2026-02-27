import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Clock, Users, DollarSign, FileText, Download } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog, Department, UserRole } from '../../types';
import { formatCurrency, exportToCSV, exportToPDF } from '../../lib/utils';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';

interface AdminDashboardTabProps {
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  selectedCycle: string;
  currentRate: number;
}

const PIE_COLORS = ['#18181b', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  allLogs,
  allUsers,
  allDepartments,
  selectedCycle,
  currentRate,
}) => {
  const stats = useMemo(() => {
    const cycleLogs = allLogs.filter(log => isDateInCycle(log.date, selectedCycle));
    const totalHours = cycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const totalGlobalPayment = totalHours * currentRate;
    const activeStudents = allUsers.filter(u => u.role === UserRole.STUDENT).length;

    const deptMap = cycleLogs.reduce((acc, log) => {
      const deptName = allDepartments.find(d => d.id === log.departmentId)?.name || 'N/A';
      acc[deptName] = (acc[deptName] || 0) + log.hours;
      return acc;
    }, {} as Record<string, number>);
    const deptChartData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    const studentMap = cycleLogs.reduce((acc, log) => {
      const studentName = allUsers.find(u => u.id === log.studentId)?.name?.split(' ')[0] || 'N/A';
      acc[studentName] = (acc[studentName] || 0) + log.hours;
      return acc;
    }, {} as Record<string, number>);
    const studentChartData = (Object.entries(studentMap) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, hours]) => ({ name, hours }));

    return { totalHours, totalGlobalPayment, activeStudents, deptChartData, studentChartData };
  }, [allLogs, allUsers, allDepartments, selectedCycle, currentRate]);

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Departamento', 'Fecha', 'Horas', 'Estado'];
    const rows = allLogs.map(log => [
      allUsers.find(u => u.id === log.studentId)?.name || 'N/A',
      allDepartments.find(d => d.id === log.departmentId)?.name || 'N/A',
      log.date,
      log.hours,
      log.status,
    ]);
    if (type === 'csv') exportToCSV('reporte_general.csv', headers, rows);
    else exportToPDF('reporte_general.pdf', 'Reporte General de Horas Beca', headers, rows);
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Horas Ciclo" value={stats.totalHours.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
        <DashboardCard title="Estudiantes Activos" value={stats.activeStudents} icon={<Users className="h-5 w-5" />} />
        <DashboardCard title="Total Pago Global" value={formatCurrency(stats.totalGlobalPayment)} icon={<DollarSign className="h-5 w-5 text-emerald-500" />} />
      </div>

      {/* Charts */}
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
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Global Logs Table */}
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
          <WorkLogTable
            logs={allLogs.filter(l => isDateInCycle(l.date, selectedCycle))}
            users={allUsers}
            departments={allDepartments}
            title=""
            showStudent
            showDepartment
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AdminDashboardTab;
