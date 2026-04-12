import React, { useState, useMemo } from 'react';
import { Users, Search, Lock, HelpCircle, ChevronUp, ChevronDown, Eye, Inbox } from 'lucide-react';
import { User, Department } from '../../types';
import { Input, Button } from '../../components/ui';
import type { SortField, SortDir, ActiveFilter } from '../../hooks/useSuperAdminData';

const PAGE_OPTIONS = [10, 25, 50];

interface SuperAdminStudentHelpProps {
  filteredStudents: User[];
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  onResetPassword: (user: User) => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  sortDir: SortDir;
  setSortDir: (d: SortDir) => void;
  activeFilter: ActiveFilter;
  setActiveFilter: (f: ActiveFilter) => void;
  onViewDetail: (user: User) => void;
  allDepartments: Department[];
}

const SuperAdminStudentHelp: React.FC<SuperAdminStudentHelpProps> = ({
  filteredStudents,
  studentSearch,
  setStudentSearch,
  onResetPassword,
  sortField,
  setSortField,
  sortDir,
  setSortDir,
  activeFilter,
  setActiveFilter,
  onViewDetail,
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filteredStudents.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filteredStudents, safePage, pageSize],
  );

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(0);
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />
      : null;

  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-2xl">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Ayuda a Estudiantes</h3>
            <p className="text-xs text-muted">
              Gestión de recuperación de contraseñas para alumnos
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted bg-surface px-3 py-1 rounded-full">
          {filteredStudents.length} estudiante{filteredStudents.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar estudiante por nombre o carnet..."
          value={studentSearch}
          onChange={e => { setStudentSearch(e.target.value); setPage(0); }}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* ── Filters bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-[10px]">
        <span className="text-muted font-medium">Estado:</span>
        {(['all', 'active', 'inactive'] as const).map(f => (
          <button
            key={f}
            onClick={() => { setActiveFilter(f); setPage(0); }}
            className={`px-3 py-1 rounded-lg border transition-colors ${
              activeFilter === f
                ? 'bg-primary text-primary-fg border-primary'
                : 'bg-surface text-muted border-border-faint hover:border-border'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
          </button>
        ))}
        <span className="ml-4 text-muted font-medium">Ordenar:</span>
        <button onClick={() => toggleSort('name')} className={`px-3 py-1 rounded-lg border transition-colors ${
          sortField === 'name' ? 'bg-primary text-primary-fg border-primary' : 'bg-surface text-muted border-border-faint hover:border-border'
        }`}>
          Nombre <SortIcon field="name" />
        </button>
        <button onClick={() => toggleSort('createdAt')} className={`px-3 py-1 rounded-lg border transition-colors ${
          sortField === 'createdAt' ? 'bg-primary text-primary-fg border-primary' : 'bg-surface text-muted border-border-faint hover:border-border'
        }`}>
          Creado <SortIcon field="createdAt" />
        </button>
      </div>

      {/* ── Student list ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-surface rounded-2xl mb-4">
              <Inbox className="w-8 h-8 text-faint" />
            </div>
            <p className="text-sm font-medium text-muted">Sin resultados</p>
            <p className="text-xs text-faint mt-1">Intenta con otro término de búsqueda o filtro.</p>
          </div>
        ) : paged.map(student => (
          <div
            key={student.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-border-faint hover:border-border transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-faint group-hover:bg-primary group-hover:text-primary-fg transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{student.name}</p>
                <p className="text-[10px] font-mono text-faint">{student.carnet || '---'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" icon={<Eye className="w-3 h-3" />} onClick={() => onViewDetail(student)}>
                Ver
              </Button>
              <Button variant="outline" size="sm" icon={<Lock className="w-3 h-3" />} onClick={() => onResetPassword(student)}>
                Resetear
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-4 text-[10px] text-muted">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}
            className="bg-surface border border-border-faint rounded-lg px-2 py-1 text-[10px]"
          >
            {PAGE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>de {filteredStudents.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button disabled={safePage === 0} onClick={() => setPage(p => p - 1)} className="px-2 py-1 rounded-lg border border-border-faint disabled:opacity-40 hover:bg-surface">
            Ant.
          </button>
          <span className="px-2">{safePage + 1} / {totalPages}</span>
          <button disabled={safePage >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-2 py-1 rounded-lg border border-border-faint disabled:opacity-40 hover:bg-surface">
            Sig.
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminStudentHelp;
