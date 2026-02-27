import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  CheckCircle, 
  Download, 
  Calendar, 
  Users, 
  Building,
  ArrowRight,
  Filter,
  History,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  FileText,
  ChevronDown,
  LayoutGrid,
  CalendarDays,
  Search
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
import { User, WorkLogStatus, WorkLog, UserRole, Department } from '../types';
import { TITHE_PERCENTAGE } from '../constants';
import { cn, exportToCSV, exportToPDF, formatCurrency } from '../lib/utils';
import { getBillingCycle, isDateInCycle, getTrimester, isDateInTrimester } from '../lib/business';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

interface AccountingPortalProps {
  user: User;
  onLogout: () => void;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  updateMultipleWorkLogsStatus: (updates: { logId: string, status: WorkLogStatus }[]) => void;
  currentRate: number;
}

const AccountingPortal: React.FC<AccountingPortalProps> = ({ user, onLogout, allLogs, allUsers, allDepartments, updateMultipleWorkLogsStatus, currentRate }) => {
  const [viewMode, setViewMode] = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle] = useState(getBillingCycle().value);
  const [selectedTrimester, setSelectedTrimester] = useState(getTrimester().num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const { confirm, dialogProps } = useConfirm();

  const { filteredLogs, approvedForPayroll, processedForPayroll, totalApprovedAmount, totalProcessedAmount, chartData, deptData, weeklySummary } = useMemo(() => {
    let logs = (allLogs || []).filter(log => {
        if (viewMode === 'cycle') {
            return isDateInCycle(log.date, selectedCycle);
        } else {
            return isDateInTrimester(log.date, selectedTrimester, selectedYear);
        }
    });

    if (selectedDeptId !== 'all') {
        logs = logs.filter(l => l.departmentId === selectedDeptId);
    }

    const approvedLogs = logs.filter(log => {
        const student = (allUsers || []).find(u => u.id === log.studentId);
        const matchesSearch = student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        return log.status === WorkLogStatus.APPROVED && matchesSearch;
    });

    const processedLogs = logs.filter(log => {
        const student = (allUsers || []).find(u => u.id === log.studentId);
        const matchesSearch = student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
        return log.status === WorkLogStatus.PROCESSED && matchesSearch;
    });

    const aggregate = (logList: WorkLog[]) => Object.values(logList.reduce((acc, log) => {
        if (!acc[log.studentId]) {
            acc[log.studentId] = { studentId: log.studentId, departmentId: log.departmentId, totalHours: 0, totalAmount: 0, logIds: [] };
        }
        acc[log.studentId].totalHours += log.hours;
        acc[log.studentId].totalAmount += log.hours * currentRate;
        acc[log.studentId].logIds.push(log.id);
        return acc;
    }, {} as any));

    const aggregatedApproved = aggregate(approvedLogs);
    const aggregatedProcessed = aggregate(processedLogs);

    const totalAmount = aggregatedApproved.reduce((sum: number, item: any) => sum + item.totalAmount, 0);
    const totalProcessed = logs.filter(l => l.status === WorkLogStatus.PROCESSED).reduce((sum, log) => sum + log.hours * currentRate, 0);

    // Weekly Summary
    const weeklySummary = logs.reduce((acc, log) => {
        const date = new Date(log.date + 'T00:00:00');
        const week = `W${Math.ceil(date.getDate() / 7)}`;
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const key = `${month} - ${week}`;
        
        if (!acc[key]) acc[key] = { key, hours: 0, amount: 0 };
        acc[key].hours += log.hours;
        acc[key].amount += log.hours * currentRate;
        return acc;
    }, {} as any);

    // Chart Data: Top 5 students by amount
    const chartData = aggregatedApproved
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
        .slice(0, 5)
        .map((item: any) => ({
            name: (allUsers || []).find(u => u.id === item.studentId)?.name?.split(' ')[0] || 'N/A',
            monto: item.totalAmount
        }));

    // Dept Data: Hours per department
    const deptMap = logs.reduce((acc, log) => {
        const deptName = (allDepartments || []).find(d => d.id === log.departmentId)?.name || 'N/A';
        acc[deptName] = (acc[deptName] || 0) + log.hours;
        return acc;
    }, {} as any);

    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    return { 
      filteredLogs: logs,
      approvedForPayroll: aggregatedApproved, 
      processedForPayroll: aggregatedProcessed,
      totalApprovedAmount: totalAmount, 
      totalProcessedAmount: totalProcessed,
      chartData,
      deptData,
      weeklySummary: Object.values(weeklySummary)
    };
  }, [allLogs, selectedCycle, selectedTrimester, selectedYear, viewMode, allUsers, allDepartments, currentRate, searchTerm, selectedDeptId]);

  const handleProcessPayments = async () => {
    const label = viewMode === 'cycle' ? 'ciclo' : 'cuatrimestre';
    const ok = await confirm(`¿Procesar los pagos para el ${label} seleccionado?`, { title: 'Procesar pagos', confirmLabel: 'Procesar' });
    if (!ok) return;
    const updates = approvedForPayroll.flatMap((item: any) => item.logIds.map((logId: string) => ({ logId, status: WorkLogStatus.PROCESSED })));
    if (updates.length > 0) {
      updateMultipleWorkLogsStatus(updates);
      toast.success('Pagos procesados exitosamente', { position: 'top-center' });
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Departamento', 'Horas Totales', 'Monto Bruto', 'Diezmo (10%)', 'Monto Neto'];
    const rows = (approvedForPayroll || []).map((item: any) => {
        const tithe = item.totalAmount * TITHE_PERCENTAGE;
        return [
            (allUsers || []).find(u => u.id === item.studentId)?.name || 'N/A',
            (allDepartments || []).find(d => d.id === item.departmentId)?.name || 'N/A',
            item.totalHours,
            formatCurrency(item.totalAmount),
            formatCurrency(tithe),
            formatCurrency(item.totalAmount - tithe)
        ];
    });

    const filename = `nomina_${viewMode}_${viewMode === 'cycle' ? selectedCycle : selectedTrimester}`;
    if (type === 'csv') {
        exportToCSV(`${filename}.csv`, headers, rows);
    } else {
        exportToPDF(`${filename}.pdf`, `Reporte de Nómina - ${viewMode === 'cycle' ? 'Ciclo' : 'Cuatrimestre'}`, headers, rows);
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };
  
  return (
    <div className="min-h-screen bg-zinc-50 selection:bg-indigo-100">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />
      
      <main className="page-container py-10">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">Contabilidad</h2>
                <p className="text-zinc-500 text-sm mt-1">Gestión de nómina y procesamiento de pagos.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar estudiante..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-0"
                    />
                </div>

                <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <select 
                        value={selectedDeptId}
                        onChange={(e) => setSelectedDeptId(e.target.value)}
                        className="select-custom pl-10 pr-10"
                    >
                        <option value="all">Todos los Deptos.</option>
                        {allDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>

                <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setViewMode('cycle')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            viewMode === 'cycle' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        Ciclo
                    </button>
                    <button 
                        onClick={() => setViewMode('trimester')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                            viewMode === 'trimester' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        Cuatrimestre
                    </button>
                </div>

                {viewMode === 'cycle' ? (
                    <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <select 
                            value={selectedCycle} 
                            onChange={e => setSelectedCycle(e.target.value)}
                            className="select-custom pl-10 pr-10"
                        >
                            {Array.from({length: 12}, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const cycle = getBillingCycle(d);
                                return <option key={cycle.value} value={cycle.value}>{cycle.label}</option>;
                            })}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <select 
                                value={selectedTrimester} 
                                onChange={e => setSelectedTrimester(Number(e.target.value))}
                                className="select-custom pl-10 pr-10"
                            >
                                {[1, 2, 3].filter(t => {
                                    const currentT = getTrimester();
                                    if (selectedYear < currentT.year) return true;
                                    return t <= currentT.num;
                                }).map(t => (
                                    <option key={t} value={t}>{t === 1 ? 'Primer' : t === 2 ? 'Segundo' : 'Tercer'} Cuatrimestre</option>
                                ))}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <select 
                                value={selectedYear} 
                                onChange={e => setSelectedYear(Number(e.target.value))}
                                className="select-custom pr-10"
                            >
                                {[2024, 2025, 2026].filter(y => y <= getTrimester().year).map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-zinc-200">
                    <button onClick={() => handleExport('csv')} className="p-2 hover:bg-zinc-50 rounded-lg transition-all" title="CSV">
                        <Download className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button onClick={() => handleExport('pdf')} className="p-2 hover:bg-zinc-50 rounded-lg transition-all" title="PDF">
                        <FileText className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <DashboardCard title="Pendiente de Pago" value={formatCurrency(totalApprovedAmount)} icon={<DollarSign className="h-5 w-5"/>} />
          <DashboardCard title="Total Procesado" value={formatCurrency(totalProcessedAmount)} icon={<CheckCircle className="h-5 w-5 text-emerald-500"/>} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-zinc-100 rounded-xl">
                        <BarChart3 className="w-4 h-4 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Mayores Pagos (Top 5)</h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} tickFormatter={(val) => `₡${val/1000}k`} />
                            <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(val: number) => [formatCurrency(val), 'Monto']} />
                            <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#e4e4e7'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="p-2 bg-zinc-100 rounded-xl">
                        <PieChartIcon className="w-4 h-4 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Horas por Depto.</h3>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {deptData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={['#18181b', '#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
            <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-zinc-100 rounded-xl">
                        <CalendarDays className="w-4 h-4 text-zinc-600" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Resumen Semanal</h3>
                </div>
                <div className="space-y-4">
                    {(weeklySummary as any[]).map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">{item.key}</p>
                                <p className="text-sm font-bold">{item.hours.toFixed(1)} horas</p>
                            </div>
                            <p className="text-sm font-black text-zinc-900">{formatCurrency(item.amount)}</p>
                        </div>
                    ))}
                    {weeklySummary.length === 0 && (
                        <p className="text-xs text-zinc-400 italic text-center py-8">Sin datos para este periodo</p>
                    )}
                </div>
            </div>

            <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-zinc-100 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-zinc-600" />
                        </div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Progreso del Cuatrimestre</h3>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[1, 2, 3].map(tNum => {
                        const tLogs = (allLogs || []).filter(l => isDateInTrimester(l.date, tNum, selectedYear));
                        const tHours = tLogs.reduce((acc, l) => acc + l.hours, 0);
                        const tAmount = tHours * currentRate;
                        const isCurrent = tNum === selectedTrimester;
                        
                        return (
                            <div key={tNum} className={cn(
                                "p-6 rounded-3xl border transition-all",
                                isCurrent ? "bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-900/20" : "bg-white border-zinc-100 text-zinc-900"
                            )}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest mb-4", isCurrent ? "text-zinc-400" : "text-zinc-400")}>
                                    Cuatri {tNum}
                                </p>
                                <p className="text-2xl font-black mb-1">{tHours.toFixed(0)}h</p>
                                <p className={cn("text-xs font-bold", isCurrent ? "text-emerald-400" : "text-zinc-500")}>
                                    {formatCurrency(tAmount)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-zinc-100 rounded-2xl">
                        <TrendingUp className="w-5 h-5 text-zinc-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">Detalle de Nómina</h3>
                        <p className="text-xs text-zinc-400">Listado de estudiantes con horas aprobadas</p>
                    </div>
                </div>
            </div>
            
            <div className="overflow-hidden rounded-2xl border border-zinc-100">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
                        <tr>
                            <th className="px-6 py-4">Estudiante</th>
                            <th className="px-6 py-4">Departamento</th>
                            <th className="px-6 py-4">Horas Totales</th>
                            <th className="px-6 py-4">Bruto</th>
                            <th className="px-6 py-4">Diezmo</th>
                            <th className="px-6 py-4">Neto</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {(approvedForPayroll || []).length > 0 ? (approvedForPayroll as any[]).map(item => {
                            const tithe = item.totalAmount * TITHE_PERCENTAGE;
                            return (
                                <tr key={item.studentId} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                                                <Users className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <span className="text-sm font-medium">{(allUsers || []).find(u => u.id === item.studentId)?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2 text-sm text-zinc-500">
                                            <Building className="w-3 h-3 opacity-40" />
                                            <span>{(allDepartments || []).find(d => d.id === item.departmentId)?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold font-mono">{item.totalHours.toFixed(2)}h</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-zinc-400 font-mono">{formatCurrency(item.totalAmount)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-amber-600 font-mono">{formatCurrency(tithe)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-emerald-600 font-mono">{formatCurrency(item.totalAmount - tithe)}</span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <p className="text-sm text-zinc-400 italic">No hay pagos aprobados para procesar en este periodo.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <AnimatePresence>
                {(approvedForPayroll || []).length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 flex justify-end"
                    >
                        <button 
                            onClick={handleProcessPayments} 
                            className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/20 flex items-center space-x-3 active:scale-95"
                        >
                            <CheckCircle className="h-5 w-5 text-emerald-400"/>
                            <span>Procesar Pagos del Periodo</span>
                            <ArrowRight className="w-4 h-4 opacity-50" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </main>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AccountingPortal;
