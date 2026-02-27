import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Clock, Users, DollarSign, FileText, Download } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog, Department } from '../../types';
import { formatCurrency, exportToCSV, exportToPDF } from '../../lib/utils';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';
import { Button } from '../../components/ui';
import { useAdminDashboardStats } from '../../hooks/useAdminDashboardStats';

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
  const stats = useAdminDashboardStats({ allLogs, allUsers, allDepartments, selectedCycle, currentRate });

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Departamento', 'Fecha', 'Horas', 'Estado'];
    const cycleLogs = allLogs.filter(l => isDateInCycle(l.date, selectedCycle));
    const rows = cycleLogs.map(log => [
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
            <Button variant="icon-action" onClick={() => handleExport('csv')} title="Exportar CSV">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="sm" icon={<FileText className="w-4 h-4" />} onClick={() => handleExport('pdf')}>
              Exportar PDF
            </Button>
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
