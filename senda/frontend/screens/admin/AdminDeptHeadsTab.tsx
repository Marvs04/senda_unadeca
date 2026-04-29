import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Edit2, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, Input, Select, EmptyState } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

const INSTITUTIONAL_EMAIL_REGEX = /^[A-Z0-9._%+-]+@unadeca\.net$/i;

interface AdminDeptHeadsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void> | void;
  deleteUser: (userId: string) => Promise<void> | void;
}

const AdminDeptHeadsTab: React.FC<AdminDeptHeadsTabProps> = ({
  allUsers,
  allDepartments,
  addUser,
  updateUser,
  deleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingDeptHead, setIsAddingDeptHead] = useState(false);
  const [editingHead, setEditingHead] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmployeeNumber, setEditEmployeeNumber] = useState('');
  const [editInstitutionalEmail, setEditInstitutionalEmail] = useState('');
  const [editDepartmentId, setEditDepartmentId] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const { filteredHeads } = useAdminUsersData({ allUsers, studentSearch: '', deptHeadSearch: searchTerm });

  // ── Filters & sort ──────────────────────────────────────────────────────────
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortMode, setSortMode] = useState<'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC' | 'STATUS'>('NAME_ASC');

  const processedHeads = useMemo(() => {
    let list = filteredHeads.filter(h => {
      if (departmentFilter === '__none__' && h.departmentId) return false;
      if (departmentFilter !== 'ALL' && departmentFilter !== '__none__' && h.departmentId !== departmentFilter) return false;
      if (statusFilter === 'ACTIVE' && h.isActive === false) return false;
      if (statusFilter === 'INACTIVE' && h.isActive !== false) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortMode) {
        case 'NAME_ASC':  return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        case 'NAME_DESC': return b.name.localeCompare(a.name, 'es', { sensitivity: 'base' });
        case 'DEPT_ASC': {
          const da = allDepartments.find(d => d.id === a.departmentId)?.name ?? 'zzz';
          const db = allDepartments.find(d => d.id === b.departmentId)?.name ?? 'zzz';
          return da.localeCompare(db, 'es', { sensitivity: 'base' });
        }
        case 'STATUS': return (a.isActive === false ? 1 : 0) - (b.isActive === false ? 1 : 0);
        default: return 0;
      }
    });
    return list;
  }, [filteredHeads, departmentFilter, statusFilter, sortMode, allDepartments]);

  // ── Pagination ──────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;
  const totalPages = Math.max(1, Math.ceil(processedHeads.length / PAGE_SIZE));
  const paginatedHeads = useMemo(
    () => processedHeads.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [processedHeads, page],
  );
  useEffect(() => { setPage(0); }, [searchTerm, departmentFilter, statusFilter, sortMode]);

  const handleAddDeptHead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const employeeNumber = (form.elements.namedItem('employeeNumber') as HTMLInputElement).value.trim();
    const institutionalEmail = (form.elements.namedItem('institutionalEmail') as HTMLInputElement).value.trim();
    const departmentId = (form.elements.namedItem('departmentId') as HTMLSelectElement).value;

    if (!name || !employeeNumber) {
      toast.error('Nombre completo y numero de empleado son obligatorios.');
      return;
    }
    if (!institutionalEmail) {
      toast.error('El correo institucional es requerido.');
      return;
    }
    if (!INSTITUTIONAL_EMAIL_REGEX.test(institutionalEmail)) {
      toast.error('El correo institucional debe tener el formato usuario@unadeca.net');
      return;
    }

    try {
      await addUser({
        name,
        employeeNumber,
        institutionalEmail,
        departmentId: departmentId || undefined,
        role: UserRole.DEPT_HEAD,
        isActive: true,
      });
      setIsAddingDeptHead(false);
      form.reset();
      toast.success('Jefe de Departamento creado exitosamente');
    } catch {
      return;
    }
  };

  const openEditHead = (head: User) => {
    setEditingHead(head);
    setEditName(head.name);
    setEditEmployeeNumber(head.employeeNumber ?? '');
    setEditInstitutionalEmail(head.institutionalEmail ?? '');
    setEditDepartmentId(head.departmentId ?? '');
  };

  const handleEditHead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingHead) return;

    const name = editName.trim();
    const employeeNumber = editEmployeeNumber.trim();
    const institutionalEmail = editInstitutionalEmail.trim();
    if (!name || !employeeNumber) {
      toast.error('Nombre y número de empleado son requeridos.');
      return;
    }
    if (institutionalEmail && !INSTITUTIONAL_EMAIL_REGEX.test(institutionalEmail)) {
      toast.error('El correo institucional debe tener el formato usuario@unadeca.net');
      return;
    }

    try {
      await updateUser(editingHead.id, {
        name,
        employeeNumber,
        institutionalEmail: institutionalEmail || undefined,
        departmentId: editDepartmentId || undefined,
      });
      toast.success('Jefe de departamento actualizado', { position: 'top-center' });
      setEditingHead(null);
    } catch {
      return;
    }
  };

  const handleDelete = async (head: User) => {
    const ok = await confirm(`¿Eliminar la cuenta de ${head.name}?`, { variant: 'danger', title: 'Eliminar cuenta' });
    if (!ok) return;
    try {
      await deleteUser(head.id);
      toast.success('Cuenta eliminada correctamente');
    } catch {
      return;
    }
  };

  const handleToggleActive = async (head: User) => {
    const nextActive = head.isActive === false;
    const actionLabel = nextActive ? 'activar' : 'desactivar';
    const ok = await confirm(`¿Deseas ${actionLabel} la cuenta de ${head.name}?`, {
      title: `${nextActive ? 'Activar' : 'Desactivar'} cuenta`,
      variant: nextActive ? 'default' : 'danger',
    });
    if (!ok) return;

    try {
      await updateUser(head.id, { isActive: nextActive });
      toast.success(`Cuenta ${nextActive ? 'activada' : 'desactivada'} correctamente`, { position: 'top-center' });
    } catch {
      return;
    }
  };

  const deptOptions: SelectOption[] = [
    { value: '', label: 'Sin Asignar' },
    ...allDepartments.map(d => ({ value: d.id, label: d.name })),
  ];

  return (
    <motion.div
      key="dept-heads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <Toolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar jefe de departamento..."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddingDeptHead(true)}>
            Nuevo Jefe Depto.
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Departamento</label>
          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="select-custom text-sm"
          >
            <option value="ALL">Todos los departamentos</option>
            {allDepartments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            <option value="__none__">Sin Asignar</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Estado</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            className="select-custom text-sm"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Solo activos</option>
            <option value="INACTIVE">Solo inactivos</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-faint">Ordenar por</label>
          <select
            value={sortMode}
            onChange={e => setSortMode(e.target.value as 'NAME_ASC' | 'NAME_DESC' | 'DEPT_ASC' | 'STATUS')}
            className="select-custom text-sm"
          >
            <option value="NAME_ASC">Nombre A-Z</option>
            <option value="NAME_DESC">Nombre Z-A</option>
            <option value="DEPT_ASC">Departamento A-Z</option>
            <option value="STATUS">Activos primero</option>
          </select>
        </div>
        {(departmentFilter !== 'ALL' || statusFilter !== 'ALL' || sortMode !== 'NAME_ASC') && (
          <button
            type="button"
            onClick={() => { setDepartmentFilter('ALL'); setStatusFilter('ALL'); setSortMode('NAME_ASC'); }}
            className="text-xs text-[#1d3261] hover:underline font-medium pb-1"
          >
            Restablecer
          </button>
        )}
        <p className="text-xs text-faint pb-1 ml-auto">
          <span className="font-bold text-foreground">{processedHeads.length}</span> jefe{processedHeads.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-8 py-5">Nombre</th>
              <th className="px-8 py-5">Nº Empleado</th>
              <th className="px-8 py-5">Correo Institucional</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5">Estado</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {paginatedHeads.map(head => (
              <tr key={head.id} className="hover:bg-surface transition-colors">
                <td className="px-8 py-5 font-medium text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {head.name.charAt(0).toUpperCase()}
                    </div>
                    {head.name}
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-muted font-mono">{head.employeeNumber || '---'}</td>
                <td className="px-8 py-5 text-sm text-muted">{head.institutionalEmail || <span className="italic text-faint">Sin correo</span>}</td>
                <td className="px-8 py-5">
                  <Badge variant={allDepartments.find(d => d.id === head.departmentId) ? 'neutral' : 'warning'}>
                    {allDepartments.find(d => d.id === head.departmentId)?.name || 'Sin Asignar'}
                  </Badge>
                </td>
                <td className="px-8 py-5">
                  <Badge variant={head.isActive === false ? 'danger' : 'success'}>
                    {head.isActive === false ? 'Inactiva' : 'Activa'}
                  </Badge>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="icon-action" onClick={() => openEditHead(head)} title="Editar Cuenta">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="icon-action"
                      onClick={() => handleToggleActive(head)}
                      title={head.isActive === false ? 'Activar cuenta' : 'Desactivar cuenta'}
                      className={head.isActive === false ? 'hover:text-emerald-600 hover:bg-emerald-50' : 'hover:text-amber-600 hover:bg-amber-50'}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                    <Button variant="icon-action" onClick={() => handleDelete(head)} title="Eliminar Cuenta" className="hover:text-rose-600 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedHeads.length === 0 && (
              <EmptyState colSpan={6} message="No se encontraron jefes de departamento" />
            )}
          </tbody>
        </table>
        {/* Pagination footer */}
        {processedHeads.length > PAGE_SIZE && (
          <div className="px-8 py-4 border-t border-border-faint flex items-center justify-between">
            <p className="text-xs text-faint">
              Mostrando <span className="font-bold text-foreground">{paginatedHeads.length}</span> de{' '}
              <span className="font-bold text-foreground">{filteredHeads.length}</span> jefes
            </p>
            <div className="flex items-center gap-1">
              <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium text-faint min-w-[60px] text-center">{page + 1} / {totalPages}</span>
              <Button variant="icon-action" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Dept Head Modal */}
      <Modal
        open={isAddingDeptHead}
        onClose={() => setIsAddingDeptHead(false)}
        title="Nuevo Jefe de Departamento"
      >
        <form onSubmit={handleAddDeptHead} className="space-y-5">
          <Input label="Nombre Completo" name="name" placeholder="Ej. Juan Perez" autoFocus required />
          <Input label="Nº de Empleado" name="employeeNumber" placeholder="Ej. EMP-123" required />
          <Input label="Correo Institucional *" name="institutionalEmail" type="email" placeholder="usuario@unadeca.net" required />
          <Select label="Departamento" name="departmentId" options={deptOptions} />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setIsAddingDeptHead(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear Cuenta
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingHead}
        onClose={() => setEditingHead(null)}
        title="Editar Jefe de Departamento"
      >
        <form onSubmit={handleEditHead} className="space-y-5">
          <Input
            label="Nombre Completo"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            autoFocus
          />
          <Input
            label="Nº de Empleado"
            value={editEmployeeNumber}
            onChange={e => setEditEmployeeNumber(e.target.value)}
          />
          <Input
            label="Correo Institucional"
            type="email"
            value={editInstitutionalEmail}
            onChange={e => setEditInstitutionalEmail(e.target.value)}
            placeholder="ejemplo@unadeca.ac.cr"
          />
          <Select
            label="Departamento"
            value={editDepartmentId}
            onChange={e => setEditDepartmentId(e.target.value)}
            options={deptOptions}
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setEditingHead(null)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...dialogProps} />
    </motion.div>
  );
};

export default AdminDeptHeadsTab;
