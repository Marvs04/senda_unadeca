import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Users,
  DollarSign,
  FileText,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';
import WorkLogTable from '../../components/WorkLogTable';
import { Department, User, WorkLog, WorkLogStatus } from '../../types';
import { exportToCSV, formatCostaRicaLongDate, formatCostaRicaTime, formatCostaRicaDateTime, formatCurrency, formatIsoDate } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';
import { Button, Input, Modal, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { useAdminDashboardStats } from '../../hooks/useAdminDashboardStats';

interface AdminDashboardTabProps {
  user: User;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  selectedCycle: string;
  currentRate: number;
}

const PIE_COLORS = ['#1d3261', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

type SortMode =
  | 'RECENT'
  | 'OLDEST'
  | 'HOURS_DESC'
  | 'HOURS_ASC'
  | 'STUDENT_ASC'
  | 'DEPARTMENT_ASC'
  | 'REVIEW_RECENT'
  | 'STATUS_PRIORITY';

type DecisionFilter = 'ALL' | 'PENDING_ONLY' | 'APPROVED_ONLY' | 'REJECTED_ONLY' | 'HAS_AUDIT';
type HoursRangeFilter = 'ALL' | 'UP_TO_2' | 'BETWEEN_2_6' | 'OVER_6';

type EnrichedLog = {
  log: WorkLog;
  student?: User;
  department?: Department;
  departmentHead?: User;
};

const STATUS_PRIORITY: Record<WorkLogStatus, number> = {
  [WorkLogStatus.PENDING]: 0,
  [WorkLogStatus.REJECTED]: 1,
  [WorkLogStatus.APPROVED]: 2,
  [WorkLogStatus.PROCESSED]: 3,
};

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: WorkLogStatus.PENDING, label: 'Pendiente' },
  { value: WorkLogStatus.APPROVED, label: 'Aprobado' },
  { value: WorkLogStatus.REJECTED, label: 'Rechazado' },
  { value: WorkLogStatus.PROCESSED, label: 'Procesado' },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todas las fuentes' },
  { value: 'MANUAL', label: 'Registro manual' },
  { value: 'KIOSK', label: 'Registro kiosko' },
];

const DECISION_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todas las resoluciones' },
  { value: 'PENDING_ONLY', label: 'Sin resolver (pendientes)' },
  { value: 'APPROVED_ONLY', label: 'Resueltas aprobadas' },
  { value: 'REJECTED_ONLY', label: 'Resueltas rechazadas' },
  { value: 'HAS_AUDIT', label: 'Con traza de auditoria' },
];

const HOURS_RANGE_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Todas las duraciones' },
  { value: 'UP_TO_2', label: 'Hasta 2 horas' },
  { value: 'BETWEEN_2_6', label: 'Entre 2 y 6 horas' },
  { value: 'OVER_6', label: 'Mas de 6 horas' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'RECENT', label: 'Mas recientes primero' },
  { value: 'OLDEST', label: 'Mas antiguos primero' },
  { value: 'HOURS_DESC', label: 'Mas horas primero' },
  { value: 'HOURS_ASC', label: 'Menos horas primero' },
  { value: 'STUDENT_ASC', label: 'Estudiante A-Z' },
  { value: 'DEPARTMENT_ASC', label: 'Departamento A-Z' },
  { value: 'REVIEW_RECENT', label: 'Ultima revision reciente' },
  { value: 'STATUS_PRIORITY', label: 'Pendientes primero' },
];

function formatDateOnly(dateString: string): string {
  return formatIsoDate(dateString);
}

function formatTimeOnly(value?: string): string {
  return formatCostaRicaTime(value);
}

function statusLabel(status: WorkLogStatus): string {
  switch (status) {
    case WorkLogStatus.PENDING:
      return 'Pendiente';
    case WorkLogStatus.APPROVED:
      return 'Aprobado';
    case WorkLogStatus.REJECTED:
      return 'Rechazado';
    case WorkLogStatus.PROCESSED:
      return 'Procesado';
    default:
      return status;
  }
}

function sortAnchorTimestamp(log: WorkLog): number {
  const candidates = [log.endTime, log.approvedAt, log.rejectedAt, log.startTime];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = new Date(candidate).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  return new Date(`${log.date}T23:59:59`).getTime();
}

function reviewTimestamp(log: WorkLog): number {
  const approved = log.approvedAt ? new Date(log.approvedAt).getTime() : 0;
  const rejected = log.rejectedAt ? new Date(log.rejectedAt).getTime() : 0;
  return Math.max(Number.isNaN(approved) ? 0 : approved, Number.isNaN(rejected) ? 0 : rejected);
}

const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  user,
  allLogs,
  allUsers,
  allDepartments,
  selectedCycle,
  currentRate,
}) => {
  const stats = useAdminDashboardStats({ allLogs, allUsers, allDepartments, selectedCycle, currentRate });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WorkLogStatus>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'MANUAL' | 'KIOSK'>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('ALL');
  const [hoursRangeFilter, setHoursRangeFilter] = useState<HoursRangeFilter>('ALL');
  const [sortMode, setSortMode] = useState<SortMode>('RECENT');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'ALL' || departmentFilter !== 'ALL' || sourceFilter !== 'ALL' || decisionFilter !== 'ALL' || hoursRangeFilter !== 'ALL' || sortMode !== 'RECENT';

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (statusFilter !== 'ALL') chips.push({ key: 'status', label: STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? statusFilter, clear: () => setStatusFilter('ALL') });
    if (departmentFilter !== 'ALL') chips.push({ key: 'dept', label: allDepartments.find(d => d.id === departmentFilter)?.name ?? 'Depto', clear: () => setDepartmentFilter('ALL') });
    if (sourceFilter !== 'ALL') chips.push({ key: 'source', label: SOURCE_OPTIONS.find(o => o.value === sourceFilter)?.label ?? sourceFilter, clear: () => setSourceFilter('ALL') });
    if (decisionFilter !== 'ALL') chips.push({ key: 'decision', label: DECISION_OPTIONS.find(o => o.value === decisionFilter)?.label ?? decisionFilter, clear: () => setDecisionFilter('ALL') });
    if (hoursRangeFilter !== 'ALL') chips.push({ key: 'hours', label: HOURS_RANGE_OPTIONS.find(o => o.value === hoursRangeFilter)?.label ?? hoursRangeFilter, clear: () => setHoursRangeFilter('ALL') });
    return chips;
  }, [statusFilter, departmentFilter, sourceFilter, decisionFilter, hoursRangeFilter, allDepartments]);

  const cycleLogs = useMemo(
    () => allLogs.filter(log => isDateInCycle(log.date, selectedCycle)),
    [allLogs, selectedCycle],
  );

  const enrichedCycleLogs = useMemo<EnrichedLog[]>(
    () =>
      cycleLogs.map(log => {
        const student = allUsers.find(u => u.id === log.studentId);
        const department = allDepartments.find(d => d.id === log.departmentId);
        const departmentHead = department?.headId
          ? allUsers.find(u => u.id === department.headId)
          : undefined;

        return { log, student, department, departmentHead };
      }),
    [cycleLogs, allUsers, allDepartments],
  );

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = enrichedCycleLogs.filter(item => {
      const { log, student, department } = item;

      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;
      if (departmentFilter !== 'ALL' && log.departmentId !== departmentFilter) return false;

      const source = (log.entrySource ?? 'MANUAL').toUpperCase() as 'MANUAL' | 'KIOSK';
      if (sourceFilter !== 'ALL' && source !== sourceFilter) return false;

      if (decisionFilter === 'PENDING_ONLY' && log.status !== WorkLogStatus.PENDING) return false;
      if (decisionFilter === 'APPROVED_ONLY' && ![WorkLogStatus.APPROVED, WorkLogStatus.PROCESSED].includes(log.status)) return false;
      if (decisionFilter === 'REJECTED_ONLY' && log.status !== WorkLogStatus.REJECTED) return false;
      if (decisionFilter === 'HAS_AUDIT' && !log.approvedBy && !log.rejectedBy) return false;

      if (hoursRangeFilter === 'UP_TO_2' && log.hours > 2) return false;
      if (hoursRangeFilter === 'BETWEEN_2_6' && (log.hours <= 2 || log.hours > 6)) return false;
      if (hoursRangeFilter === 'OVER_6' && log.hours <= 6) return false;

      if (!query) return true;

      const studentName = student?.name?.toLowerCase() ?? '';
      const studentCarnet = student?.carnet?.toLowerCase() ?? '';
      const studentEmail = student?.institutionalEmail?.toLowerCase() ?? '';
      const departmentName = department?.name?.toLowerCase() ?? '';
      const costCenter = department?.costCenter?.toLowerCase() ?? '';
      const description = log.description.toLowerCase();

      return (
        studentName.includes(query) ||
        studentCarnet.includes(query) ||
        studentEmail.includes(query) ||
        departmentName.includes(query) ||
        costCenter.includes(query) ||
        description.includes(query)
      );
    });

    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'RECENT':
          return sortAnchorTimestamp(b.log) - sortAnchorTimestamp(a.log);
        case 'OLDEST':
          return sortAnchorTimestamp(a.log) - sortAnchorTimestamp(b.log);
        case 'HOURS_DESC':
          return b.log.hours - a.log.hours;
        case 'HOURS_ASC':
          return a.log.hours - b.log.hours;
        case 'STUDENT_ASC':
          return (a.student?.name ?? '').localeCompare(b.student?.name ?? '', 'es', { sensitivity: 'base' });
        case 'DEPARTMENT_ASC':
          return (a.department?.name ?? '').localeCompare(b.department?.name ?? '', 'es', { sensitivity: 'base' });
        case 'REVIEW_RECENT':
          return reviewTimestamp(b.log) - reviewTimestamp(a.log);
        case 'STATUS_PRIORITY':
          return (
            STATUS_PRIORITY[a.log.status] - STATUS_PRIORITY[b.log.status] ||
            sortAnchorTimestamp(b.log) - sortAnchorTimestamp(a.log)
          );
        default:
          return sortAnchorTimestamp(b.log) - sortAnchorTimestamp(a.log);
      }
    });

    return filtered;
  }, [
    enrichedCycleLogs,
    searchTerm,
    statusFilter,
    departmentFilter,
    sourceFilter,
    decisionFilter,
    hoursRangeFilter,
    sortMode,
  ]);

  const displayedLogs = useMemo(() => filteredLogs.map(item => item.log), [filteredLogs]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(displayedLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(
    () => displayedLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [displayedLogs, page],
  );

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [searchTerm, statusFilter, departmentFilter, sourceFilter, decisionFilter, hoursRangeFilter, sortMode]);

  const selectedLog = useMemo(
    () => (selectedLogId ? filteredLogs.find(item => item.log.id === selectedLogId) ?? null : null),
    [filteredLogs, selectedLogId],
  );

  useEffect(() => {
    if (!selectedLogId) return;
    if (!filteredLogs.some(item => item.log.id === selectedLogId)) {
      setSelectedLogId(null);
    }
  }, [filteredLogs, selectedLogId]);

  const departmentOptions = useMemo<SelectOption[]>(
    () => [
      { value: 'ALL', label: 'Todos los departamentos' },
      ...allDepartments.map(dept => ({
        value: dept.id,
        label: `${dept.name} (${dept.costCenter})`,
      })),
    ],
    [allDepartments],
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDepartmentFilter('ALL');
    setSourceFilter('ALL');
    setDecisionFilter('ALL');
    setHoursRangeFilter('ALL');
    setSortMode('RECENT');
  };

  const handleExport = async (type: 'csv' | 'pdf') => {
    const headers = [
      'Estudiante',
      'Carnet',
      'Departamento',
      'Centro de costos',
      'Fecha',
      'Hora inicio',
      'Hora fin',
      'Horas',
      'Estado',
      'Descripcion',
      'Aprobada por',
      'Fecha aprobacion',
      'Denegada por',
      'Fecha denegacion',
      'Motivo rechazo',
    ];
    const rows = filteredLogs.map(item => {
      const { log, student, department } = item;
      const approvedBy = log.approvedBy ? allUsers.find(u => u.id === log.approvedBy)?.name ?? 'N/A' : '';
      const rejectedBy = log.rejectedBy ? allUsers.find(u => u.id === log.rejectedBy)?.name ?? 'N/A' : '';

      return [
        student?.name ?? 'N/A',
        student?.carnet ?? 'N/A',
        department?.name ?? 'N/A',
        department?.costCenter ?? 'N/A',
        log.date,
        log.startTime ? formatTimeOnly(log.startTime) : '',
        log.endTime ? formatTimeOnly(log.endTime) : '',
        log.hours,
        statusLabel(log.status),
        log.description,
        approvedBy,
        log.approvedAt ? formatCostaRicaDateTime(log.approvedAt) : '',
        rejectedBy,
        log.rejectedAt ? formatCostaRicaDateTime(log.rejectedAt) : '',
        log.rejectionReason ?? '',
      ];
    });
    if (rows.length === 0) {
      toast.error('No hay registros para exportar con los filtros actuales.', { position: 'top-center' });
      return;
    }

    if (type === 'csv') {
      exportToCSV('reporte_general_filtrado.csv', headers, rows);
    } else {
      const now = formatCostaRicaLongDate();
      await renderPDF({
        filename: 'reporte_general_filtrado.pdf',
        reportTitle: 'REPORTE GENERAL DE HORAS BECA',
        subtitle: `Ciclo ${selectedCycle} — vista filtrada de registros globales`,
        meta: [
          { label: 'Ciclo', value: selectedCycle },
          { label: 'Fecha de Emision', value: now },
          { label: 'Administrador', value: user.name },
          { label: 'Registros incluidos', value: String(rows.length) },
        ],
        headers,
        rows,
      });
    }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Horas Ciclo" value={`${stats.totalHours.toLocaleString()}h`} icon={<Clock className="h-5 w-5" />} subtitle={`Ciclo ${selectedCycle} · ${cycleLogs.length} registros`} />
        <DashboardCard title="Estudiantes Activos" value={stats.activeStudents} icon={<Users className="h-5 w-5" />} subtitle={`${Math.round((stats.activeStudents / Math.max(allUsers.length, 1)) * 100)}% del total de usuarios`} />
        <DashboardCard title="Total Pago Global" value={formatCurrency(stats.totalGlobalPayment)} icon={<DollarSign className="h-5 w-5 text-emerald-500" />} subtitle={`Tarifa vigente: ${formatCurrency(currentRate)}/h`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="icon-box">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-faint">Horas por Estudiante (Top 5)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.studentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#7a8aa8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#7a8aa8' }} label={{ value: 'Horas', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#7a8aa8', fontWeight: 600 } }} />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                  labelFormatter={(label: string) => `Estudiante: ${label}`}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {stats.studentChartData.map((_, index) => (
                    <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="icon-box">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-faint">Distribucion por Depto.</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.deptChartData} cx="50%" cy="45%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                  {stats.deptChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, 'Horas']}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', fontWeight: 600, paddingTop: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-border-faint flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="icon-box-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Registros Globales</h3>
              <p className="text-xs text-faint">Mas recientes primero por defecto. Toca una fila para ver detalle completo.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="icon-action" onClick={() => handleExport('csv')} title="Exportar CSV filtrado">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="primary" size="sm" icon={<FileText className="w-4 h-4" />} onClick={() => handleExport('pdf')}>
              Exportar PDF
            </Button>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-border-faint bg-surface/40">
          {/* Primary filters (always visible) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Busqueda rapida"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Nombre, carnet, correo, depto, costo o descripcion"
            />
            <Select
              label="Estado"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'ALL' | WorkLogStatus)}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Departamento"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              options={departmentOptions}
            />
          </div>

          {/* Secondary filters (collapsible) */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowMoreFilters(prev => !prev)}
              className="text-xs font-medium text-[#1d3261] hover:underline flex items-center gap-1"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
              {showMoreFilters ? 'Menos filtros' : 'Más filtros'}
            </button>
            {showMoreFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-3">
                <Select
                  label="Fuente"
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value as 'ALL' | 'MANUAL' | 'KIOSK')}
                  options={SOURCE_OPTIONS}
                />
                <Select
                  label="Resolucion"
                  value={decisionFilter}
                  onChange={e => setDecisionFilter(e.target.value as DecisionFilter)}
                  options={DECISION_OPTIONS}
                />
                <Select
                  label="Rango de horas"
                  value={hoursRangeFilter}
                  onChange={e => setHoursRangeFilter(e.target.value as HoursRangeFilter)}
                  options={HOURS_RANGE_OPTIONS}
                />
                <Select
                  label="Orden"
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  options={SORT_OPTIONS}
                />
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {activeFilterChips.map(chip => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1d3261]/10 text-[#1d3261] rounded-lg text-[11px] font-medium"
                >
                  {chip.label}
                  <button type="button" onClick={chip.clear} className="hover:text-rose-600 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-faint">
              Mostrando <span className="font-bold text-foreground">{paginatedLogs.length}</span> de{' '}
              <span className="font-bold text-foreground">{displayedLogs.length}</span> registros filtrados ({cycleLogs.length} en ciclo).
            </p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs font-medium text-faint min-w-[60px] text-center">{page + 1} / {totalPages}</span>
                <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw className="w-4 h-4" />}
                onClick={handleResetFilters}
                disabled={!hasActiveFilters}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </div>

        <div className="p-2">
          <WorkLogTable
            logs={paginatedLogs}
            users={allUsers}
            departments={allDepartments}
            title=""
            showStudent
            showDepartment
            onRowClick={log => setSelectedLogId(log.id)}
            selectedLogId={selectedLogId}
          />
        </div>
      </div>

      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLogId(null)}
        width="lg"
        title="Detalle completo del registro"
        subtitle={selectedLog ? `${selectedLog.student?.name ?? 'N/A'} · ${formatDateOnly(selectedLog.log.date)}` : ''}
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Estudiante</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.student?.name ?? 'N/A'}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Carnet</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.student?.carnet ?? 'N/A'}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Departamento</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.department?.name ?? 'N/A'}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Jefe de Departamento</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.departmentHead?.name ?? 'No asignado'}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Fecha</p>
                <p className="text-sm font-semibold text-foreground mt-1">{formatDateOnly(selectedLog.log.date)}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Centro de costos</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.department?.costCenter ?? 'N/A'}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Hora de inicio</p>
                <p className="text-sm font-semibold text-foreground mt-1">{formatTimeOnly(selectedLog.log.startTime)}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Hora de finalizacion</p>
                <p className="text-sm font-semibold text-foreground mt-1">{formatTimeOnly(selectedLog.log.endTime)}</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Horas totales</p>
                <p className="text-sm font-semibold text-foreground mt-1">{selectedLog.log.hours.toFixed(2)} h</p>
              </div>
              <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
                <p className="text-[10px] font-black uppercase tracking-widest text-faint">Estado</p>
                <p className="text-sm font-semibold text-foreground mt-1">{statusLabel(selectedLog.log.status)}</p>
              </div>
            </div>

            <div className="bg-surface rounded-2xl px-4 py-3 border border-border-faint">
              <p className="text-[10px] font-black uppercase tracking-widest text-faint">Descripcion</p>
              <p className="text-sm text-foreground mt-1 whitespace-pre-line">{selectedLog.log.description}</p>
            </div>

            {(selectedLog.log.status === WorkLogStatus.APPROVED || selectedLog.log.status === WorkLogStatus.PROCESSED) && (
              <div className="bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Aprobacion</p>
                <p className="text-sm text-emerald-900 mt-1">
                  Aprobada por: <span className="font-semibold">{selectedLog.log.approvedBy ? allUsers.find(u => u.id === selectedLog.log.approvedBy)?.name ?? 'N/A' : 'N/A'}</span>
                </p>
                <p className="text-sm text-emerald-900 mt-1">
                  Hora: <span className="font-semibold">{formatTimeOnly(selectedLog.log.approvedAt)}</span>
                </p>
              </div>
            )}

            {selectedLog.log.status === WorkLogStatus.REJECTED && (
              <div className="bg-rose-50 rounded-2xl px-4 py-3 border border-rose-200">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Denegacion</p>
                <p className="text-sm text-rose-900 mt-1">
                  Denegada por: <span className="font-semibold">{selectedLog.log.rejectedBy ? allUsers.find(u => u.id === selectedLog.log.rejectedBy)?.name ?? 'N/A' : 'N/A'}</span>
                </p>
                <p className="text-sm text-rose-900 mt-1">
                  Hora: <span className="font-semibold">{formatTimeOnly(selectedLog.log.rejectedAt)}</span>
                </p>
                <p className="text-sm text-rose-900 mt-1">
                  Motivo: <span className="font-semibold">{selectedLog.log.rejectionReason ?? 'N/A'}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default AdminDashboardTab;
