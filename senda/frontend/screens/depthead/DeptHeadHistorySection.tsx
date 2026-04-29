import React, { useEffect, useMemo, useState } from 'react';
import {
  History,
  Download,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import WorkLogTable from '../../components/WorkLogTable';
import { Button, Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { User, WorkLog, WorkLogStatus, Department } from '../../types';
import { exportToCSV, formatCostaRicaLongDate, formatCurrencyPdf } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { isDateInCycle } from '../../lib/business';

interface DeptHeadHistorySectionProps {
  myLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  selectedCycle: string;
  departmentName: string;
  deptHeadName: string;
}

type SortMode = 'RECENT' | 'OLDEST' | 'HOURS_DESC' | 'HOURS_ASC' | 'STUDENT_ASC';
type HoursRangeFilter = 'ALL' | 'UP_TO_2' | 'BETWEEN_2_6' | 'OVER_6';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'ALL',                    label: 'Todos los estados' },
  { value: WorkLogStatus.APPROVED,   label: 'Aprobado' },
  { value: WorkLogStatus.REJECTED,   label: 'Rechazado' },
  { value: WorkLogStatus.PROCESSED,  label: 'Procesado' },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'ALL',    label: 'Todas las fuentes' },
  { value: 'MANUAL', label: 'Registro manual' },
  { value: 'KIOSK',  label: 'Registro kiosco' },
];

const HOURS_RANGE_OPTIONS: SelectOption[] = [
  { value: 'ALL',          label: 'Todas las duraciones' },
  { value: 'UP_TO_2',      label: 'Hasta 2 horas' },
  { value: 'BETWEEN_2_6',  label: 'Entre 2 y 6 horas' },
  { value: 'OVER_6',       label: 'Más de 6 horas' },
];

const SORT_OPTIONS: SelectOption[] = [
  { value: 'RECENT',      label: 'Más recientes primero' },
  { value: 'OLDEST',      label: 'Más antiguos primero' },
  { value: 'HOURS_DESC',  label: 'Más horas primero' },
  { value: 'HOURS_ASC',   label: 'Menos horas primero' },
  { value: 'STUDENT_ASC', label: 'Estudiante A-Z' },
];

function statusLabel(status: WorkLogStatus): string {
  switch (status) {
    case WorkLogStatus.PENDING:   return 'Pendiente';
    case WorkLogStatus.APPROVED:  return 'Aprobado';
    case WorkLogStatus.REJECTED:  return 'Rechazado';
    case WorkLogStatus.PROCESSED: return 'Procesado';
    default: return status;
  }
}

const PAGE_SIZE = 15;

const DeptHeadHistorySection: React.FC<DeptHeadHistorySectionProps> = ({
  myLogs,
  allUsers,
  allDepartments,
  selectedCycle,
  departmentName,
  deptHeadName,
}) => {
  const [searchTerm,      setSearchTerm]      = useState('');
  const [statusFilter,    setStatusFilter]    = useState<'ALL' | WorkLogStatus>('ALL');
  const [sourceFilter,    setSourceFilter]    = useState<'ALL' | 'MANUAL' | 'KIOSK'>('ALL');
  const [hoursFilter,     setHoursFilter]     = useState<HoursRangeFilter>('ALL');
  const [sortMode,        setSortMode]        = useState<SortMode>('RECENT');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page,            setPage]            = useState(0);

  const hasActiveFilters =
    searchTerm !== '' || statusFilter !== 'ALL' || sourceFilter !== 'ALL' ||
    hoursFilter !== 'ALL' || sortMode !== 'RECENT';

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (statusFilter !== 'ALL') chips.push({ key: 'status', label: STATUS_OPTIONS.find(o => o.value === statusFilter)?.label ?? statusFilter, clear: () => setStatusFilter('ALL') });
    if (sourceFilter !== 'ALL') chips.push({ key: 'source', label: SOURCE_OPTIONS.find(o => o.value === sourceFilter)?.label ?? sourceFilter, clear: () => setSourceFilter('ALL') });
    if (hoursFilter  !== 'ALL') chips.push({ key: 'hours',  label: HOURS_RANGE_OPTIONS.find(o => o.value === hoursFilter)?.label ?? hoursFilter, clear: () => setHoursFilter('ALL') });
    return chips;
  }, [statusFilter, sourceFilter, hoursFilter]);

  const cycleLogs = useMemo(
    () => (myLogs || []).filter(l => l.status !== WorkLogStatus.PENDING && isDateInCycle(l.date, selectedCycle)),
    [myLogs, selectedCycle],
  );

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = cycleLogs.filter(log => {
      if (statusFilter !== 'ALL' && log.status !== statusFilter) return false;

      const source = (log.entrySource ?? 'MANUAL').toUpperCase() as 'MANUAL' | 'KIOSK';
      if (sourceFilter !== 'ALL' && source !== sourceFilter) return false;

      if (hoursFilter === 'UP_TO_2'     && log.hours > 2)                     return false;
      if (hoursFilter === 'BETWEEN_2_6' && (log.hours <= 2 || log.hours > 6)) return false;
      if (hoursFilter === 'OVER_6'      && log.hours <= 6)                     return false;

      if (!query) return true;

      const student = allUsers.find(u => u.id === log.studentId);
      const studentName   = student?.name?.toLowerCase()   ?? '';
      const studentCarnet = student?.carnet?.toLowerCase() ?? '';
      const description   = log.description.toLowerCase();

      return studentName.includes(query) || studentCarnet.includes(query) || description.includes(query);
    });

    filtered.sort((a, b) => {
      const tsA = new Date(a.endTime ?? a.date + 'T23:59').getTime();
      const tsB = new Date(b.endTime ?? b.date + 'T23:59').getTime();
      switch (sortMode) {
        case 'RECENT':      return tsB - tsA;
        case 'OLDEST':      return tsA - tsB;
        case 'HOURS_DESC':  return b.hours - a.hours;
        case 'HOURS_ASC':   return a.hours - b.hours;
        case 'STUDENT_ASC': {
          const nA = allUsers.find(u => u.id === a.studentId)?.name ?? '';
          const nB = allUsers.find(u => u.id === b.studentId)?.name ?? '';
          return nA.localeCompare(nB, 'es', { sensitivity: 'base' });
        }
        default: return tsB - tsA;
      }
    });

    return filtered;
  }, [cycleLogs, searchTerm, statusFilter, sourceFilter, hoursFilter, sortMode, allUsers]);

  const totalPages   = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const paginatedLogs = useMemo(
    () => filteredLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [filteredLogs, page],
  );

  useEffect(() => { setPage(0); }, [searchTerm, statusFilter, sourceFilter, hoursFilter, sortMode, selectedCycle]);

  const handleResetFilters = () => {
    setSearchTerm(''); setStatusFilter('ALL'); setSourceFilter('ALL');
    setHoursFilter('ALL'); setSortMode('RECENT');
  };

  const handleExport = async (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Fecha', 'Horas', 'Descripción', 'Estado', 'Razón Rechazo'];
    const rows = filteredLogs.map(log => [
      allUsers.find(u => u.id === log.studentId)?.name || 'N/A',
      log.date,
      log.hours,
      log.description,
      statusLabel(log.status),
      log.rejectionReason || '',
    ]);
    if (rows.length === 0) {
      toast.info('No hay registros para exportar con los filtros actuales.', { position: 'top-center' });
      return;
    }
    const safeDept = departmentName.replace(/\s+/g, '_');
    if (type === 'csv') {
      exportToCSV(`historial_${safeDept}.csv`, headers, rows);
      toast.success('Reporte CSV generado', { position: 'top-center' });
    } else {
      const now = formatCostaRicaLongDate();
      await renderPDF({
        filename: `historial_${safeDept}.pdf`,
        reportTitle: `HISTORIAL — ${departmentName.toUpperCase()}`,
        subtitle: `Registros aprobados y procesados — ciclo ${selectedCycle}`,
        meta: [
          { label: 'Departamento',         value: departmentName },
          { label: 'Fecha de Emisión',     value: now },
          { label: 'Jefe de Departamento', value: deptHeadName },
          { label: 'Registros incluidos',  value: String(rows.length) },
        ],
        headers,
        rows,
      });
      toast.success('Reporte PDF generado', { position: 'top-center' });
    }
  };

  return (
    <div className="bg-card rounded-[2rem] border border-border-faint shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border-faint flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="icon-box-lg">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Historial del Departamento</h3>
            <p className="text-xs text-muted">Registros aprobados y procesados</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="icon-action" onClick={() => handleExport('csv')} title="Exportar CSV">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="sm" icon={<FileText className="h-4 w-4" />} onClick={() => handleExport('pdf')}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-8 py-5 border-b border-border-faint bg-surface/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Búsqueda rápida"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Nombre, carnet o descripción"
          />
          <Select
            label="Estado"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'ALL' | WorkLogStatus)}
            options={STATUS_OPTIONS}
          />
          <Select
            label="Fuente"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value as 'ALL' | 'MANUAL' | 'KIOSK')}
            options={SOURCE_OPTIONS}
          />
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <Select
                label="Rango de horas"
                value={hoursFilter}
                onChange={e => setHoursFilter(e.target.value as HoursRangeFilter)}
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
            <span className="font-bold text-foreground">{filteredLogs.length}</span> registros ({cycleLogs.length} en ciclo).
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
        />
      </div>
    </div>
  );
};

export default DeptHeadHistorySection;
