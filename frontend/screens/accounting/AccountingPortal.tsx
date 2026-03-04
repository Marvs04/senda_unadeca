import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
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
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import DashboardCard from '../../components/DashboardCard';
import { User, WorkLogStatus, WorkLog, Department } from '../../types';
import { TITHE_PERCENTAGE } from '../../constants';
import { cn, exportToCSV, formatCurrency } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { getBillingCycle, getTrimester } from '../../lib/business';
import { useAccountingData } from '../../hooks/useAccountingData';
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
  const currentTrimester = getTrimester();
  const [selectedTrimester, setSelectedTrimester] = useState(currentTrimester.num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  const [selectedDeptId, setSelectedDeptId] = useState('all');
  const { confirm, dialogProps } = useConfirm();

  const {
    approvedForPayroll,
    totalApprovedAmount,
    totalProcessedAmount,
    chartData,
    deptData,
    weeklySummary,
  } = useAccountingData({
    allLogs,
    allUsers,
    allDepartments,
    viewMode,
    selectedCycle,
    selectedTrimester,
    selectedYear,
    searchTerm: debouncedSearch,
    selectedDeptId,
    currentRate,
  });

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
    const period = viewMode === 'cycle'
      ? `Ciclo ${selectedCycle}`
      : `Cuatrimestre ${selectedTrimester} \u2014 ${selectedYear}`;
    if (type === 'csv') {
      exportToCSV(`${filename}.csv`, headers, rows);
    } else {
      const now = new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
      renderPDF({
        filename: `${filename}.pdf`,
        reportTitle: `N\u00d3MINA DE PAGOS \u2014 ${period.toUpperCase()}`,
        subtitle: 'Resumen de horas aprobadas, montos brutos, diezmo y pago neto',
        meta: [
          { label: 'Per\u00edodo',         value: period },
          { label: 'Fecha de Emisi\u00f3n', value: now },
          { label: 'Responsable',      value: user.name },
          { label: 'Tipo de Reporte',  value: 'N\u00f3mina de Pagos' },
        ],
        headers,
        rows,
      });
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-background selection:bg-surface-hover">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
              Contabilidad
            </h2>
            <p className="text-muted text-sm mt-1">
              Gestión de nómina y procesamiento de pagos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
              <input
                type="text"
                placeholder="Buscar estudiante..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs focus:ring-0"
              />
            </div>

            {/* Dept filter */}
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
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
              <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
            </div>

            {/* View mode toggle */}
            <div className="flex items-center space-x-1 bg-surface p-1 rounded-xl">
              <button
                onClick={() => setViewMode('cycle')}
                className={cn(
                  'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  viewMode === 'cycle'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground',
                )}
              >
                Ciclo
              </button>
              <button
                onClick={() => setViewMode('trimester')}
                className={cn(
                  'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                  viewMode === 'trimester'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground',
                )}
              >
                Cuatrimestre
              </button>
            </div>

            {/* Period selector */}
            {viewMode === 'cycle' ? (
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
                    return (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                  <select
                    value={selectedTrimester}
                    onChange={e => setSelectedTrimester(Number(e.target.value))}
                    className="select-custom pl-10 pr-10"
                  >
                    {[1, 2, 3]
                      .filter(t => {
                        if (selectedYear < currentTrimester.year) return true;
                        return t <= currentTrimester.num;
                      })
                      .map(t => (
                        <option key={t} value={t}>
                          {t === 1 ? 'Primer' : t === 2 ? 'Segundo' : 'Tercer'} Cuatrimestre
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="select-custom pr-10"
                  >
                    {[2024, 2025, 2026]
                      .filter(y => y <= currentTrimester.year)
                      .map(y => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
                </div>
              </div>
            )}

            {/* Export buttons */}
            <div className="flex items-center space-x-1 bg-card p-1 rounded-xl border border-border">
              <button
                onClick={() => handleExport('csv')}
                className="p-2 hover:bg-surface rounded-lg transition-all"
                title="CSV"
              >
                <Download className="w-4 h-4 text-faint" />
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="p-2 hover:bg-surface rounded-lg transition-all"
                title="PDF"
              >
                <FileText className="w-4 h-4 text-faint" />
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
          allUsers={allUsers}
          allDepartments={allDepartments}
          onProcessPayments={handleProcessPayments}
        />
      <ConfirmDialog {...dialogProps} />
    </PortalLayout>
  );
};

export default AccountingPortal;
