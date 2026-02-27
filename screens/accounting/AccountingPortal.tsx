import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  CheckCircle,
  Download,
  Calendar,
  Building,
  FileText,
  ChevronDown,
  CalendarDays,
  Search,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { User, WorkLogStatus, WorkLog, Department } from '../../types';
import { TITHE_PERCENTAGE } from '../../constants';
import { cn, exportToCSV, exportToPDF, formatCurrency } from '../../lib/utils';
import { getBillingCycle, isDateInCycle, getTrimester, isDateInTrimester } from '../../lib/business';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../../components/ConfirmDialog';
import AccountingCharts from './AccountingCharts';
import AccountingPayrollTable from './AccountingPayrollTable';

interface AccountingPortalProps {
  user: User;
  onLogout: () => void;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  updateMultipleWorkLogsStatus: (updates: { logId: string; status: WorkLogStatus }[]) => void;
  currentRate: number;
}

const AccountingPortal: React.FC<AccountingPortalProps> = ({
  user,
  onLogout,
  allLogs,
  allUsers,
  allDepartments,
  updateMultipleWorkLogsStatus,
  currentRate,
}) => {
  const [viewMode, setViewMode] = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle] = useState(getBillingCycle().value);
  const [selectedTrimester, setSelectedTrimester] = useState(getTrimester().num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const { confirm, dialogProps } = useConfirm();

  const {
    filteredLogs,
    approvedForPayroll,
    processedForPayroll,
    totalApprovedAmount,
    totalProcessedAmount,
    chartData,
    deptData,
    weeklySummary,
  } = useMemo(() => {
    let logs = (allLogs || []).filter(log => {
      if (viewMode === 'cycle') return isDateInCycle(log.date, selectedCycle);
      return isDateInTrimester(log.date, selectedTrimester, selectedYear);
    });

    if (selectedDeptId !== 'all') logs = logs.filter(l => l.departmentId === selectedDeptId);

    const approvedLogs = logs.filter(log => {
      const student = (allUsers || []).find(u => u.id === log.studentId);
      const matchesSearch =
        student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return log.status === WorkLogStatus.APPROVED && matchesSearch;
    });

    const processedLogs = logs.filter(log => {
      const student = (allUsers || []).find(u => u.id === log.studentId);
      const matchesSearch =
        student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      return log.status === WorkLogStatus.PROCESSED && matchesSearch;
    });

    const aggregate = (logList: WorkLog[]) =>
      Object.values(
        logList.reduce(
          (acc, log) => {
            if (!acc[log.studentId]) {
              acc[log.studentId] = {
                studentId: log.studentId,
                departmentId: log.departmentId,
                totalHours: 0,
                totalAmount: 0,
                logIds: [],
              };
            }
            acc[log.studentId].totalHours += log.hours;
            acc[log.studentId].totalAmount += log.hours * currentRate;
            acc[log.studentId].logIds.push(log.id);
            return acc;
          },
          {} as Record<
            string,
            {
              studentId: string;
              departmentId: string;
              totalHours: number;
              totalAmount: number;
              logIds: string[];
            }
          >,
        ),
      );

    const aggregatedApproved = aggregate(approvedLogs);
    const aggregatedProcessed = aggregate(processedLogs);

    const totalAmount = aggregatedApproved.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalProcessed = logs
      .filter(l => l.status === WorkLogStatus.PROCESSED)
      .reduce((sum, log) => sum + log.hours * currentRate, 0);

    // Weekly summary
    const weeklySummary = logs.reduce(
      (acc, log) => {
        const date = new Date(log.date + 'T00:00:00');
        const week = `W${Math.ceil(date.getDate() / 7)}`;
        const month = date.toLocaleString('es-ES', { month: 'short' });
        const key = `${month} - ${week}`;
        if (!acc[key]) acc[key] = { key, hours: 0, amount: 0 };
        acc[key].hours += log.hours;
        acc[key].amount += log.hours * currentRate;
        return acc;
      },
      {} as Record<string, { key: string; hours: number; amount: number }>,
    );

    // Top 5 chart data
    const chartData = aggregatedApproved
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map(item => ({
        name:
          (allUsers || []).find(u => u.id === item.studentId)?.name?.split(' ')[0] || 'N/A',
        monto: item.totalAmount,
      }));

    // Dept hours
    const deptMap = logs.reduce(
      (acc, log) => {
        const deptName =
          (allDepartments || []).find(d => d.id === log.departmentId)?.name || 'N/A';
        acc[deptName] = (acc[deptName] || 0) + log.hours;
        return acc;
      },
      {} as Record<string, number>,
    );

    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    return {
      filteredLogs: logs,
      approvedForPayroll: aggregatedApproved,
      processedForPayroll: aggregatedProcessed,
      totalApprovedAmount: totalAmount,
      totalProcessedAmount: totalProcessed,
      chartData,
      deptData,
      weeklySummary: Object.values(weeklySummary),
    };
  }, [
    allLogs,
    selectedCycle,
    selectedTrimester,
    selectedYear,
    viewMode,
    allUsers,
    allDepartments,
    currentRate,
    searchTerm,
    selectedDeptId,
  ]);

  const handleProcessPayments = async () => {
    const label = viewMode === 'cycle' ? 'ciclo' : 'cuatrimestre';
    const ok = await confirm(`¿Procesar los pagos para el ${label} seleccionado?`, {
      title: 'Procesar pagos',
      confirmLabel: 'Procesar',
    });
    if (!ok) return;
    const updates = approvedForPayroll.flatMap(item =>
      item.logIds.map(logId => ({ logId, status: WorkLogStatus.PROCESSED })),
    );
    if (updates.length > 0) {
      updateMultipleWorkLogsStatus(updates);
      toast.success('Pagos procesados exitosamente', { position: 'top-center' });
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = [
      'Estudiante',
      'Departamento',
      'Horas Totales',
      'Monto Bruto',
      'Diezmo (10%)',
      'Monto Neto',
    ];
    const rows = approvedForPayroll.map(item => {
      const tithe = item.totalAmount * TITHE_PERCENTAGE;
      return [
        (allUsers || []).find(u => u.id === item.studentId)?.name || 'N/A',
        (allDepartments || []).find(d => d.id === item.departmentId)?.name || 'N/A',
        item.totalHours,
        formatCurrency(item.totalAmount),
        formatCurrency(tithe),
        formatCurrency(item.totalAmount - tithe),
      ];
    });
    const filename = `nomina_${viewMode}_${viewMode === 'cycle' ? selectedCycle : selectedTrimester}`;
    if (type === 'csv') {
      exportToCSV(`${filename}.csv`, headers, rows);
    } else {
      exportToPDF(
        `${filename}.pdf`,
        `Reporte de Nómina - ${viewMode === 'cycle' ? 'Ciclo' : 'Cuatrimestre'}`,
        headers,
        rows,
      );
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  return (
    <div className="min-h-screen bg-zinc-50 selection:bg-indigo-100">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />

      <main className="page-container py-10">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">
              Contabilidad
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              Gestión de nómina y procesamiento de pagos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-xs focus:ring-0"
              />
            </div>

            {/* Dept filter */}
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <select
                value={selectedDeptId}
                onChange={e => setSelectedDeptId(e.target.value)}
                className="select-custom pl-10 pr-10"
              >
                <option value="all">Todos los Deptos.</option>
                {allDepartments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center space-x-1 bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cycle')}
                className={cn(
                  'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  viewMode === 'cycle'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700',
                )}
              >
                Ciclo
              </button>
              <button
                onClick={() => setViewMode('trimester')}
                className={cn(
                  'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  viewMode === 'trimester'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700',
                )}
              >
                Cuatrimestre
              </button>
            </div>

            {/* Period selector */}
            {viewMode === 'cycle' ? (
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <select
                  value={selectedCycle}
                  onChange={e => setSelectedCycle(e.target.value)}
                  className="select-custom pl-10 pr-10"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const cycle = getBillingCycle(d);
                    return (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    );
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
                    {[1, 2, 3]
                      .filter(t => {
                        const currentT = getTrimester();
                        if (selectedYear < currentT.year) return true;
                        return t <= currentT.num;
                      })
                      .map(t => (
                        <option key={t} value={t}>
                          {t === 1 ? 'Primer' : t === 2 ? 'Segundo' : 'Tercer'} Cuatrimestre
                        </option>
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
                    {[2024, 2025, 2026]
                      .filter(y => y <= getTrimester().year)
                      .map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Export buttons */}
            <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => handleExport('csv')}
                className="p-2 hover:bg-zinc-50 rounded-lg transition-all"
                title="CSV"
              >
                <Download className="w-4 h-4 text-zinc-400" />
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="p-2 hover:bg-zinc-50 rounded-lg transition-all"
                title="PDF"
              >
                <FileText className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <DashboardCard
            title="Pendiente de Pago"
            value={formatCurrency(totalApprovedAmount)}
            icon={<DollarSign className="h-5 w-5" />}
          />
          <DashboardCard
            title="Total Procesado"
            value={formatCurrency(totalProcessedAmount)}
            icon={<CheckCircle className="h-5 w-5 text-emerald-500" />}
          />
        </div>

        {/* Charts + Summary */}
        <AccountingCharts
          chartData={chartData}
          deptData={deptData}
          weeklySummary={weeklySummary}
          selectedTrimester={selectedTrimester}
          selectedYear={selectedYear}
          allLogs={allLogs}
          currentRate={currentRate}
        />

        {/* Payroll Table */}
        <AccountingPayrollTable
          approvedForPayroll={approvedForPayroll}
          allUsers={allUsers || []}
          allDepartments={allDepartments || []}
          onProcessPayments={handleProcessPayments}
        />
      </main>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default AccountingPortal;
