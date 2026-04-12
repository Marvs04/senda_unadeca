import React, { useState, useMemo } from 'react';
import { Users, Search, RefreshCw, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { User, UserRole, Department } from '../../types';
import { Badge, Button } from '../../components/ui';
import type { SortField, SortDir, ActiveFilter } from '../../hooks/useSuperAdminData';

const PAGE_OPTIONS = [10, 25, 50];

interface SuperAdminAccountListProps {
  filteredAdmins: User[];
  adminSearch: string;
  setAdminSearch: (v: string) => void;
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

const SuperAdminAccountList: React.FC<SuperAdminAccountListProps> = ({
  filteredAdmins,
  adminSearch,
  setAdminSearch,
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

  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => filteredAdmins.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [filteredAdmins, safePage, pageSize],
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
          <div className="icon-box-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Cuentas Administrativas</h3>
            <p className="text-xs text-muted">
              Usuarios con acceso de gestión, contabilidad y jefaturas
            </p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="Buscar cuenta..."
            value={adminSearch}
            onChange={e => { setAdminSearch(e.target.value); setPage(0); }}
            className="w-full bg-surface border-border rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all text-[10px]"
          />
        </div>
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-faint">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('name')}>
                Nombre <SortIcon field="name" />
              </th>
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('role')}>
                Rol <SortIcon field="role" />
              </th>
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                Creado <SortIcon field="createdAt" />
              </th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {paged.map(admin => (
              <tr key={admin.id} className="hover:bg-surface transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                      <span className="text-xs font-bold text-faint">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{admin.name}</p>
                      {admin.employeeNumber && (
                        <p className="text-[10px] text-faint font-mono">
                          {admin.employeeNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      admin.role === UserRole.ADMIN ? 'indigo'
                      : admin.role === UserRole.DEPT_HEAD ? 'success'
                      : 'neutral'
                    }
                  >
                    {admin.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-xs text-muted">
                  {admin.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <Button variant="ghost" size="sm" icon={<Eye className="w-3 h-3" />} onClick={() => onViewDetail(admin)}>
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3 h-3" />} onClick={() => onResetPassword(admin)}>
                    Resetear
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <span>de {filteredAdmins.length}</span>
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

export default SuperAdminAccountList;
