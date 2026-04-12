import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Users, Search, RefreshCw, ChevronUp, ChevronDown, Eye, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { User, UserRole, Department } from '../../types';
import { Badge, Button } from '../../components/ui';
import type { SortField, SortDir, ActiveFilter } from '../../hooks/useSuperAdminData';

const PAGE_OPTIONS = [10, 25, 50];

const ROLE_AVATAR_COLORS: Record<string, string> = {
  [UserRole.ADMIN]:      'bg-indigo-100 text-indigo-700',
  [UserRole.ACCOUNTING]: 'bg-amber-100 text-amber-700',
  [UserRole.DEPT_HEAD]:  'bg-emerald-100 text-emerald-700',
};

/* ── Inline dropdown menu ───────────────────────────────────────────────── */
const ActionsMenu: React.FC<{ user: User; onView: (u: User) => void; onReset: (u: User) => void; onToggle: (u: User) => void }> = ({ user, onView, onReset, onToggle }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg hover:bg-surface transition-colors text-muted hover:text-foreground"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-card rounded-xl border border-border-faint shadow-lg z-20 py-1 text-xs">
          <button
            onClick={() => { onView(user); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-left"
          >
            <Eye className="w-3 h-3" /> Ver detalle
          </button>
          <button
            onClick={() => { onReset(user); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-left"
          >
            <RefreshCw className="w-3 h-3" /> Resetear clave
          </button>
          <div className="border-t border-border-faint my-1" />
          <button
            onClick={() => { onToggle(user); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-left ${
              user.isActive !== false ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {user.isActive !== false
              ? <><UserX className="w-3 h-3" /> Desactivar</>
              : <><UserCheck className="w-3 h-3" /> Activar</>}
          </button>
        </div>
      )}
    </div>
  );
};

interface SuperAdminAccountListProps {
  filteredAdmins: User[];
  adminSearch: string;
  setAdminSearch: (v: string) => void;
  onResetPassword: (user: User) => void;
  onToggleActive: (user: User) => void;
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
  onToggleActive,
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
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('employeeNumber')}>
                No. Empleado <SortIcon field="employeeNumber" />
              </th>
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('role')}>
                Rol <SortIcon field="role" />
              </th>
              <th className="px-6 py-4 cursor-pointer select-none" onClick={() => toggleSort('isActive')}>
                Estado <SortIcon field="isActive" />
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ROLE_AVATAR_COLORS[admin.role] ?? 'bg-surface text-faint'}`}>
                      <span className="text-xs font-bold">
                        {admin.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{admin.name}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs font-mono">
                  {admin.employeeNumber
                    ? <span className="text-muted">{admin.employeeNumber}</span>
                    : <span className="text-faint italic">Sin asignar</span>}
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
                <td className="px-6 py-4">
                  <Badge variant={admin.isActive !== false ? 'success' : 'danger'}>
                    {admin.isActive !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-xs text-muted">
                  {admin.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'}
                </td>
                <td className="px-6 py-4 text-right">
                  <ActionsMenu user={admin} onView={onViewDetail} onReset={onResetPassword} onToggle={onToggleActive} />
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
