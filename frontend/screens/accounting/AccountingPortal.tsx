import React, { useState, useCallback, useMemo } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion } from 'motion/react';
import {
  DollarSign,
  CheckSquare,
  Download,
  Calendar,
  Building,
  FileText,
  ChevronDown,
  CalendarDays,
  Search,
  Receipt,
  Minus,
} from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import DashboardCard from '../../components/DashboardCard';
import { User, WorkLogStatus, WorkLog, Department } from '../../types';
import { cn, exportToCSV, formatCostaRicaLongDate, formatCurrency } from '../../lib/utils';
import { renderDeptGroupedPDF } from '../../lib/pdf';
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
  const [viewMode, setViewMode]               = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle]     = useState(getBillingCycle().value);
  const currentTrimester                      = getTrimester();
  const [selectedTrimester, setSelectedTrimester] = useState(currentTrimester.num);
  const [selectedYear, setSelectedYear]       = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm]           = useState('');
  const debouncedSearch                       = useDebounce(searchTerm);
  const [selectedDeptId, setSelectedDeptId]   = useState('all');
  const { confirm, dialogProps }              = useConfirm();

  // ── Period key for localStorage registered state ──────────────────────────
  const periodKey = viewMode === 'cycle'
    ? `cycle_${selectedCycle}`
    : `q${selectedTrimester}_${selectedYear}`;

  // ── Registered IDs: persisted in localStorage per period ─────────────────
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`senda_registered_${periodKey}`);
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Re-load from localStorage when period changes
  const loadRegistered = useCallback((key: string): Set<string> => {
    try {
      const raw = localStorage.getItem(`senda_registered_${key}`);
      return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, []);

  const handleViewModeChange = (mode: 'cycle' | 'trimester') => {
    setViewMode(mode);
    const nextKey = mode === 'cycle'
      ? `cycle_${selectedCycle}`
      : `q${selectedTrimester}_${selectedYear}`;
    setRegisteredIds(loadRegistered(nextKey));
  };

  const handleCycleChange = (cycle: string) => {
    setSelectedCycle(cycle);
    setRegisteredIds(loadRegistered(`cycle_${cycle}`));
  };

  const handleTrimesterChange = (t: number) => {
    setSelectedTrimester(t);
    setRegisteredIds(loadRegistered(`q${t}_${selectedYear}`));
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    setRegisteredIds(loadRegistered(`q${selectedTrimester}_${y}`));
  };

  const toggleRegistered = useCallback((studentId: string) => {
    setRegisteredIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      try {
        localStorage.setItem(
          `senda_registered_${periodKey}`,
          JSON.stringify([...next]),
        );
      } catch { /* ignore */ }
      return next;
    });
  }, [periodKey]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    approvedForPayroll,
    approvedBooks,
    processedBooks,
    totalApprovedAmount,
    totalProcessedAmount,
    chartData,
    deptChartData,
    weeklySummary,
    trimesterSummary,
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

  const totalTithe = useMemo(
    () => approvedForPayroll.reduce((s, i) => s + i.totalTithe, 0),
    [approvedForPayroll],
  );
  const totalNeto = useMemo(
    () => approvedForPayroll.reduce((s, i) => s + i.totalNeto, 0),
    [approvedForPayroll],
  );
  const totalHours = useMemo(
    () => approvedForPayroll.reduce((s, i) => s + i.totalHours, 0),
    [approvedForPayroll],
  );

  // ── Process payments ──────────────────────────────────────────────────────
  const handleProcessPayments = async () => {
    const label = viewMode === 'cycle' ? 'ciclo' : 'cuatrimestre';
    const ok = await confirm(
      `¿Procesar todos los pagos aprobados para el ${label} seleccionado? Esto marcará las horas como procesadas.`,
      { title: 'Procesar pagos', confirmLabel: 'Procesar' },
    );
    if (!ok) return;
    const updates = approvedForPayroll.flatMap(item =>
      item.logIds.map(logId => ({ logId, status: WorkLogStatus.PROCESSED })),
    );
    if (updates.length > 0) {
      updateMultipleWorkLogsStatus(updates);
      toast.success('Pagos procesados exitosamente', { position: 'top-center' });
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const period = viewMode === 'cycle'
    ? `Ciclo ${selectedCycle}`
    : `Cuatrimestre ${selectedTrimester} \u2014 ${selectedYear}`;

  const filenameBase = `nomina_${viewMode === 'cycle' ? selectedCycle : `q${selectedTrimester}_${selectedYear}`}`;

  const handleExportCSV = () => {
    const headers = ['Departamento', 'Estudiante', 'Carnet', 'Horas', 'Bruto', 'Diezmo', 'Neto'];
    const rows = approvedBooks.flatMap(book =>
      book.students.map(s => [
        book.departmentName,
        s.studentName,
        s.carnet ?? '—',
        s.totalHours.toFixed(2),
        formatCurrency(s.totalBruto),
        formatCurrency(s.totalTithe),
        formatCurrency(s.totalNeto),
      ]),
    );
    exportToCSV(`${filenameBase}.csv`, headers, rows);
    toast.success('CSV generado', { position: 'top-center' });
  };

  const handleExportPDF = () => {
    const now = formatCostaRicaLongDate();
    renderDeptGroupedPDF({
      filename:    `${filenameBase}.pdf`,
      reportTitle: `N\u00d3MINA DE PAGOS \u2014 ${period.toUpperCase()}`,
      subtitle:    'Desglose por departamento: bruto facturado, diezmo y pago neto',
      meta: [
        { label: 'Per\u00edodo',          value: period },
        { label: 'Fecha de Emisi\u00f3n', value: now },
        { label: 'Responsable',       value: user.name },
        { label: 'Total Bruto',       value: formatCurrency(totalApprovedAmount) },
        { label: 'Diezmo Total',      value: formatCurrency(totalTithe) },
        { label: 'Total Neto',        value: formatCurrency(totalNeto) },
      ],
      deptGroups: approvedBooks.map(book => ({
        deptName:   book.departmentName,
        students:   book.students.map(s => ({
          name:  s.studentName,
          carnet: s.carnet ?? '—',
          hours:  s.totalHours.toFixed(2),
          bruto:  formatCurrency(s.totalBruto),
          tithe:  formatCurrency(s.totalTithe),
          neto:   formatCurrency(s.totalNeto),
        })),
        totalHours: book.totalHours.toFixed(2),
        totalBruto: formatCurrency(book.totalBruto),
        totalTithe: formatCurrency(book.totalTithe),
        totalNeto:  formatCurrency(book.totalNeto),
      })),
      grandTotals: {
        hours: totalHours.toFixed(2),
        bruto: formatCurrency(totalApprovedAmount),
        tithe: formatCurrency(totalTithe),
        neto:  formatCurrency(totalNeto),
      },
    });
    toast.success('PDF generado', { position: 'top-center' });
  };

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-background selection:bg-surface-hover">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-display">
            Contabilidad
          </h2>
          <p className="text-muted text-sm mt-1">
            Nómina de becados · cierres el 25 de cada mes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search: name or carnet */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
            <input
              type="text"
              placeholder="Buscar por nombre o carnet..."
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
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 bg-surface p-1 rounded-xl border border-border-faint">
            <button
              onClick={() => handleViewModeChange('cycle')}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                viewMode === 'cycle' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
              )}
            >
              Ciclo
            </button>
            <button
              onClick={() => handleViewModeChange('trimester')}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                viewMode === 'trimester' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
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
                onChange={e => handleCycleChange(e.target.value)}
                className="select-custom pl-10 pr-10"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - i);
                  const cycle = getBillingCycle(d);
                  return (
                    <option key={cycle.value} value={cycle.value}>{cycle.label}</option>
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
                  onChange={e => handleTrimesterChange(Number(e.target.value))}
                  className="select-custom pl-10 pr-10"
                >
                  {[1, 2, 3]
                    .filter(t => selectedYear < currentTrimester.year || t <= currentTrimester.num)
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
                  onChange={e => handleYearChange(Number(e.target.value))}
                  className="select-custom pr-10"
                >
                  {[2024, 2025, 2026]
                    .filter(y => y <= currentTrimester.year)
                    .map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
              </div>
            </div>
          )}

          {/* Export */}
          <div className="flex items-center space-x-1 bg-card p-1 rounded-xl border border-border">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-surface rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest text-muted"
              title="Exportar CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 hover:bg-surface rounded-lg transition-all text-[10px] font-bold uppercase tracking-widest text-muted"
              title="Exportar PDF por departamento"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total Facturado"
          value={formatCurrency(totalApprovedAmount)}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <DashboardCard
          title="Diezmo (10%)"
          value={formatCurrency(totalTithe)}
          icon={<Minus className="h-5 w-5" />}
        />
        <DashboardCard
          title="Total Neto a Pagar"
          value={formatCurrency(totalNeto)}
          icon={<Receipt className="h-5 w-5" />}
        />
        <DashboardCard
          title="Ya Procesado"
          value={formatCurrency(totalProcessedAmount)}
          icon={<CheckSquare className="h-5 w-5" />}
        />
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <AccountingCharts
        chartData={chartData}
        deptChartData={deptChartData}
        weeklySummary={weeklySummary}
        trimesterSummary={trimesterSummary}
        selectedTrimester={selectedTrimester}
        selectedYear={selectedYear}
        currentRate={currentRate}
      />

      {/* ── Department Books ──────────────────────────────────────────────── */}
      <AccountingPayrollTable
        approvedBooks={approvedBooks}
        processedBooks={processedBooks}
        registeredIds={registeredIds}
        onToggleRegistered={toggleRegistered}
        onProcessPayments={handleProcessPayments}
      />

      <ConfirmDialog {...dialogProps} />
    </PortalLayout>
  );
};

export default AccountingPortal;
