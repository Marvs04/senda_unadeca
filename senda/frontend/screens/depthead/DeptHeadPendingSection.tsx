import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, CheckSquare, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog, Department } from '../../types';
import { Button } from '../../components/ui';

type SortField = 'date' | 'hours' | 'student';
type SortDir   = 'asc' | 'desc';

interface DeptHeadPendingSectionProps {
  pendingLogs: WorkLog[];
  onApproveAll: () => void;
  renderActions: (log: WorkLog) => React.ReactNode;
  allUsers: User[];
  allDepartments: Department[];
}

const DeptHeadPendingSection: React.FC<DeptHeadPendingSectionProps> = ({
  pendingLogs,
  onApproveAll,
  renderActions,
  allUsers,
  allDepartments,
}) => {
  const [search,  setSearch]  = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir,   setSortDir]   = useState<SortDir>('desc');
  const [filterStudent, setFilterStudent] = useState('');

  const getUserName = (id: string) => allUsers.find(u => u.id === id)?.name ?? '';

  const uniqueStudents = useMemo(() =>
    [...new Map(pendingLogs.map(l => [l.studentId, getUserName(l.studentId)])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])),
    [pendingLogs, allUsers]
  );

  const filtered = useMemo(() => {
    let list = [...pendingLogs];

    if (filterStudent) list = list.filter(l => l.studentId === filterStudent);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l =>
        getUserName(l.studentId).toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.date.includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')    cmp = a.date.localeCompare(b.date);
      if (sortField === 'hours')   cmp = a.hours - b.hours;
      if (sortField === 'student') cmp = getUserName(a.studentId).localeCompare(getUserName(b.studentId));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [pendingLogs, search, filterStudent, sortField, sortDir, allUsers]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-amber-500" />
      : <ArrowDown className="w-3 h-3 text-amber-500" />;
  };

  const hasFilters = search || filterStudent;

  if (pendingLogs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-card p-8 rounded-[2rem] border border-amber-100 shadow-sm shadow-amber-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl">
            <CheckSquare className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Pendientes de Aprobación</h3>
            <p className="text-xs text-muted">
              {filtered.length} de {pendingLogs.length} registros
            </p>
          </div>
        </div>
        <Button variant="success" size="sm" icon={<CheckCircle className="h-4 w-4" />} onClick={onApproveAll}>
          Aprobar Todo
        </Button>
      </div>

      {/* Filtros y sorts */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Búsqueda */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
          <input
            type="text"
            placeholder="Buscar estudiante, descripción, fecha…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border-faint bg-surface focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-muted" />
            </button>
          )}
        </div>

        {/* Filtro por estudiante */}
        {uniqueStudents.length > 1 && (
          <select
            value={filterStudent}
            onChange={e => setFilterStudent(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border-faint bg-surface focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="">Todos los estudiantes</option>
            {uniqueStudents.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}

        {/* Sort buttons */}
        <div className="flex items-center gap-1 bg-surface border border-border-faint rounded-xl px-2 py-1">
          <span className="text-[10px] uppercase tracking-wider text-muted mr-1">Orden:</span>
          {(['date', 'hours', 'student'] as SortField[]).map(f => (
            <button
              key={f}
              onClick={() => toggleSort(f)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                sortField === f
                  ? 'bg-amber-100 text-amber-700 font-semibold'
                  : 'text-muted hover:bg-amber-50'
              }`}
            >
              {{ date: 'Fecha', hours: 'Horas', student: 'Estudiante' }[f]}
              <SortIcon field={f} />
            </button>
          ))}
        </div>

        {/* Limpiar filtros */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setFilterStudent(''); }}
            className="flex items-center gap-1 px-3 py-2 text-xs text-amber-600 hover:text-amber-800 rounded-xl hover:bg-amber-50 transition-colors"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <WorkLogTable
        logs={filtered}
        users={allUsers}
        departments={allDepartments}
        title=""
        showStudent
        actions={renderActions}
      />
    </motion.div>
  );
};

export default DeptHeadPendingSection;
