import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Building, Plus, Edit2, Trash2, Search, MoreHorizontal, Users } from 'lucide-react';
import { User, UserRole, Department } from '../../types';
import { Badge, Button, Modal, Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../../components/ConfirmDialog';

const COST_CENTER_REGEX = /^\d{2}-\d{2}-\d{2}$/;

function formatCostCenterInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/* ── Inline dropdown menu ───────────────────────────────────────────────── */
const ActionsMenu: React.FC<{ dept: Department; onEdit: (d: Department) => void; onDelete: (d: Department) => void }> = ({ dept, onEdit, onDelete }) => {
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
        <div className="absolute right-0 mt-1 w-40 bg-card rounded-xl border border-border-faint shadow-lg z-20 py-1 text-xs">
          <button
            onClick={() => { onEdit(dept); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-left"
          >
            <Edit2 className="w-3 h-3" /> Editar
          </button>
          <div className="border-t border-border-faint my-1" />
          <button
            onClick={() => { onDelete(dept); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface transition-colors text-left text-rose-600"
          >
            <Trash2 className="w-3 h-3" /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

interface SuperAdminDepartmentListProps {
  allDepartments: Department[];
  allUsers: User[];
  addDepartment: (newDepartment: Omit<Department, 'id'>) => Promise<void> | void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => Promise<void> | void;
  deleteDepartment: (deptId: string) => Promise<void> | void;
}

const SuperAdminDepartmentList: React.FC<SuperAdminDepartmentListProps> = ({
  allDepartments,
  allUsers,
  addDepartment,
  updateDepartment,
  deleteDepartment,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHeadId, setNewDeptHeadId] = useState('');
  const [newDeptCostCenter, setNewDeptCostCenter] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const deptHeads = useMemo(
    () => allUsers.filter(u => u.role === UserRole.DEPT_HEAD),
    [allUsers],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allDepartments;
    const q = search.toLowerCase();
    return allDepartments.filter(d =>
      d.name.toLowerCase().includes(q) || d.costCenter.toLowerCase().includes(q),
    );
  }, [allDepartments, search]);

  const openAdd = () => {
    setEditingDept(null);
    setNewDeptName('');
    setNewDeptHeadId('');
    setNewDeptCostCenter('');
    setIsAddingDept(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.name);
    setNewDeptHeadId(dept.headId || '');
    setNewDeptCostCenter(dept.costCenter || '');
    setIsAddingDept(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = newDeptName.trim();
    const normalizedCostCenter = formatCostCenterInput(newDeptCostCenter);

    if (!normalizedName) {
      toast.error('El nombre del departamento es requerido.');
      return;
    }
    if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
      toast.error('Centro de costos inválido. Usa formato NN-NN-NN.');
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, {
          name: normalizedName,
          headId: newDeptHeadId || undefined,
          costCenter: normalizedCostCenter,
        });
        toast.success('Departamento actualizado exitosamente');
      } else {
        await addDepartment({
          name: normalizedName,
          headId: newDeptHeadId || undefined,
          costCenter: normalizedCostCenter,
        });
        toast.success('Departamento creado exitosamente');
      }
    } catch {
      return;
    }

    setIsAddingDept(false);
    setNewDeptName('');
    setNewDeptHeadId('');
    setNewDeptCostCenter('');
    setEditingDept(null);
  };

  const handleDelete = async (dept: Department) => {
    const ok = await confirm(
      `¿Eliminar el departamento ${dept.name}? Esta acción no se puede deshacer.`,
      { title: 'Eliminar departamento', variant: 'danger' },
    );
    if (!ok) return;

    try {
      await deleteDepartment(dept.id);
      toast.success('Departamento eliminado correctamente');
    } catch {
      return;
    }
  };

  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <Building className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Departamentos</h3>
            <p className="text-xs text-muted">
              Gestión de departamentos, jefes y centros de costos
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="text"
              placeholder="Buscar departamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border-border rounded-xl py-2 pl-9 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all text-[10px]"
            />
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-3 h-3" />} onClick={openAdd}>
            Nuevo
          </Button>
        </div>
      </div>

      {/* ── Department table ─────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border-faint">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-6 py-4">Departamento</th>
              <th className="px-6 py-4">Centro de Costos</th>
              <th className="px-6 py-4">Jefe</th>
              <th className="px-6 py-4">Estudiantes</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="p-4 bg-surface rounded-2xl mb-4">
                      <Building className="w-8 h-8 text-faint" />
                    </div>
                    <p className="text-sm font-medium text-muted">Sin departamentos</p>
                    <p className="text-xs text-faint mt-1">Crea un departamento para comenzar.</p>
                  </div>
                </td>
              </tr>
            ) : filtered.map(dept => {
              const deptHead = allUsers.find(u => u.id === dept.headId);
              const studentCount = allUsers.filter(u => u.departmentId === dept.id && u.role === UserRole.STUDENT).length;

              return (
                <tr key={dept.id} className="hover:bg-surface transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <span className="text-xs font-bold">{dept.name.charAt(0)}</span>
                      </div>
                      <p className="text-sm font-medium">{dept.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-muted">{dept.costCenter}</td>
                  <td className="px-6 py-4 text-xs">
                    {deptHead
                      ? <span className="text-foreground font-medium">{deptHead.name}</span>
                      : <span className="text-faint italic">Sin asignar</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={studentCount > 0 ? 'neutral' : 'danger'}>
                      <Users className="w-3 h-3 mr-1 inline" />{studentCount}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionsMenu dept={dept} onEdit={openEdit} onDelete={handleDelete} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        open={isAddingDept}
        onClose={() => setIsAddingDept(false)}
        title={editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nombre del Departamento"
            type="text"
            value={newDeptName}
            onChange={e => setNewDeptName(e.target.value)}
            placeholder="Ej. Recursos Humanos"
            autoFocus
          />
          <Input
            label="Centro de costos"
            type="text"
            value={newDeptCostCenter}
            onChange={e => setNewDeptCostCenter(formatCostCenterInput(e.target.value))}
            placeholder="Ej. 10-00-01"
            maxLength={8}
            required
            hint="Formato contable requerido: 2 dígitos, guion, 2 dígitos, guion, 2 dígitos"
          />
          <Select
            label="Jefe de Departamento"
            value={newDeptHeadId}
            onChange={e => setNewDeptHeadId(e.target.value)}
            options={[
              { value: '', label: 'Sin Asignar' },
              ...deptHeads.map(h => ({ value: h.id, label: h.name })),
            ] satisfies SelectOption[]}
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={() => setIsAddingDept(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {editingDept ? 'Guardar Cambios' : 'Crear Depto.'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default SuperAdminDepartmentList;
