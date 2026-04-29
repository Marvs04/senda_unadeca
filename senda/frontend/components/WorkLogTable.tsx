import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { WorkLog, User, Department, WorkLogStatus } from '../types';
import { cn, truncate } from '../lib/utils';
import { Calendar, Clock, FileText, Building, Search, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import { StatusBadge, EmptyState } from './ui';

type SortField = 'date' | 'hours';
type SortDir   = 'asc' | 'desc';

interface WorkLogTableProps {
  logs: WorkLog[];
  users: User[];
  departments: Department[];
  title: string;
  showStudent?: boolean;
  showDepartment?: boolean;
  actions?: (log: WorkLog) => React.ReactNode;
  variant?: 'light' | 'dark';
  onRowClick?: (log: WorkLog) => void;
  selectedLogId?: string | null;
  /** When true renders an inline search + status filter + sort bar above the table */
  enableFilters?: boolean;
}

const WorkLogTable: React.FC<WorkLogTableProps> = ({ 
  logs, 
  users, 
  departments, 
  title, 
  showStudent = false, 
  showDepartment = false, 
  actions,
  variant = 'light',
  onRowClick,
  selectedLogId,
  enableFilters = false,
}) => {
  const isDark = variant === 'dark';
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'N/A';
  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  // ── Internal filter/sort state (only used when enableFilters=true) ──────────
  const [search,      setSearch]      = useState('');
  const [statusFlt,   setStatusFlt]   = useState<'ALL' | WorkLogStatus>('ALL');
  const [sortField,   setSortField]   = useState<SortField>('date');
  const [sortDir,     setSortDir]     = useState<SortDir>('desc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-indigo-500" />
      : <ArrowDown className="w-3 h-3 text-indigo-500" />;
  };

  const displayedLogs = useMemo(() => {
    if (!enableFilters) return logs || [];

    let list = [...(logs || [])];

    // Status filter
    if (statusFlt !== 'ALL') list = list.filter(l => l.status === statusFlt);

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        l.description.toLowerCase().includes(q) ||
        l.date.includes(q) ||
        getUserName(l.studentId).toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      const cmp = sortField === 'date'
        ? a.date.localeCompare(b.date)
        : a.hours - b.hours;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [logs, enableFilters, search, statusFlt, sortField, sortDir]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = enableFilters && (search || statusFlt !== 'ALL');

  const formatHours = (hours: number) => {
    if (hours < 0.1) {
      const minutes = Math.round(hours * 60);
      return `${minutes} min`;
    }
    return `${hours}h`;
  };

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden transition-all duration-300",
      isDark 
        ? "bg-dark-hover border-white/10 text-white" 
        : "bg-card border-border-faint text-foreground shadow-sm"
    )}>
      <div className="px-6 py-5 border-b border-inherit flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 font-display">{title}</h3>
        <span className="text-[10px] font-bold px-2 py-1 bg-inherit border border-inherit rounded-lg opacity-50">
          {enableFilters && displayedLogs.length !== (logs || []).length
            ? `${displayedLogs.length} de ${(logs || []).length} Registros`
            : `${(logs || []).length} Registros`}
        </span>
      </div>

      {/* ── Inline filter bar (only when enableFilters=true) ─────────────────── */}
      {enableFilters && (
        <div className={cn(
          "px-6 py-3 border-b border-inherit flex flex-wrap items-center gap-3",
          isDark ? "bg-white/5" : "bg-surface",
        )}>
          {/* Search */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar…"
              className={cn(
                "w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none",
                isDark
                  ? "bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                  : "bg-card border-border-faint text-foreground placeholder:text-muted focus:border-primary/40",
              )}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFlt}
            onChange={e => setStatusFlt(e.target.value as 'ALL' | WorkLogStatus)}
            className={cn(
              "text-xs rounded-lg border px-2 py-1.5 outline-none",
              isDark
                ? "bg-white/5 border-white/20 text-white focus:border-white/40"
                : "bg-card border-border-faint text-foreground focus:border-primary/40",
            )}
          >
            <option value="ALL">Todos</option>
            <option value={WorkLogStatus.PENDING}>Pendiente</option>
            <option value={WorkLogStatus.APPROVED}>Aprobado</option>
            <option value={WorkLogStatus.REJECTED}>Rechazado</option>
            <option value={WorkLogStatus.PROCESSED}>Procesado</option>
          </select>

          {/* Sort buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => toggleSort('date')}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors",
                sortField === 'date'
                  ? "border-indigo-400 text-indigo-600 bg-indigo-50"
                  : isDark ? "border-white/20 text-white/50 hover:border-white/40" : "border-border-faint text-muted hover:border-border",
              )}
            >
              Fecha <SortIcon field="date" />
            </button>
            <button
              onClick={() => toggleSort('hours')}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition-colors",
                sortField === 'hours'
                  ? "border-indigo-400 text-indigo-600 bg-indigo-50"
                  : isDark ? "border-white/20 text-white/50 hover:border-white/40" : "border-border-faint text-muted hover:border-border",
              )}
            >
              Horas <SortIcon field="hours" />
            </button>
          </div>

          {/* Clear button */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatusFlt('ALL'); }}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
            >
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
              "text-[10px] uppercase tracking-widest font-bold opacity-40",
              isDark ? "bg-white/5" : "bg-surface"
            )}>
              {showStudent && <th className="px-6 py-3">Estudiante</th>}
              {showDepartment && <th className="px-6 py-3">Departamento</th>}
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Horas</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3">Estado</th>
              {actions && <th className="px-6 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit">
            {displayedLogs.length > 0 ? displayedLogs.map((log, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={log.id} 
                className={cn(
                  "group transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-surface",
                  onRowClick && "cursor-pointer",
                  selectedLogId === log.id && (isDark ? 'bg-white/10' : 'bg-primary/5')
                )}
                onClick={onRowClick ? () => onRowClick(log) : undefined}
              >
                {showStudent && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {getUserName(log.studentId).charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{getUserName(log.studentId)}</span>
                    </div>
                  </td>
                )}
                {showDepartment && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       <Building className="w-3 h-3 opacity-40" />
                       <span className="text-sm opacity-70">{getDepartmentName(log.departmentId)}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-sm opacity-70">
                    <Calendar className="w-3 h-3 opacity-40" />
                    <span>{new Date(log.date + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 opacity-40" />
                    <span className="text-sm font-bold font-display">{formatHours(log.hours)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 max-w-xs">
                    <FileText className="w-3 h-3 opacity-40 flex-shrink-0" />
                    <span className="text-sm opacity-60" title={log.description}>{truncate(log.description, 60)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={log.status} rejectionReason={log.rejectionReason} />
                </td>
                {actions && (
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end">
                      {actions(log)}
                    </div>
                  </td>
                )}
              </motion.tr>
            )) : (
              <EmptyState colSpan={10} message={hasFilters ? 'No hay registros con esos filtros' : 'No hay registros disponibles'} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkLogTable;
