import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Building, Trash2 } from 'lucide-react';
import { User, WorkLog, Department, UserRole } from '../../types';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Button, Modal, Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

const COST_CENTER_REGEX = /^\d{2}-\d{4}$/;

function formatCostCenterInput(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2)}`;
}

interface AdminDepartmentsTabProps {
  allDepartments: Department[];
  allUsers: User[];
  allLogs: WorkLog[];
  selectedCycle: string;
  addDepartment: (newDepartment: Omit<Department, 'id'>) => Promise<void> | void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => Promise<void> | void;
  deleteDepartment: (deptId: string) => Promise<void> | void;
}

const AdminDepartmentsTab: React.FC<AdminDepartmentsTabProps> = ({
  allDepartments,
  allUsers,
  allLogs,
  selectedCycle,
  addDepartment,
  updateDepartment,
  deleteDepartment,
}) => {
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHeadId, setNewDeptHeadId] = useState('');
  const [newDeptCostCenter, setNewDeptCostCenter] = useState('');
  const { confirm, dialogProps } = useConfirm();

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
      toast.error('El nombre del departamento es requerido.', { position: 'top-center' });
      return;
    }
    if (!COST_CENTER_REGEX.test(normalizedCostCenter)) {
      toast.error('Centro de costos invalido. Usa formato NN-NNNN.', { position: 'top-center' });
      return;
    }

    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, {
          name: normalizedName,
          headId: newDeptHeadId || undefined,
          costCenter: normalizedCostCenter,
        });
        toast.success('Departamento actualizado exitosamente', { position: 'top-center' });
      } else {
        await addDepartment({
          name: normalizedName,
          headId: newDeptHeadId || undefined,
          costCenter: normalizedCostCenter,
        });
        toast.success('Departamento creado exitosamente', { position: 'top-center' });
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

  const deptHeads = allUsers.filter(u => u.role === UserRole.DEPT_HEAD);

  const handleDelete = async (dept: Department) => {
    const ok = await confirm(
      `¿Eliminar el departamento ${dept.name}? Esta acción no se puede deshacer.`,
      { title: 'Eliminar departamento', variant: 'danger' },
    );
    if (!ok) return;

    try {
      await deleteDepartment(dept.id);
      toast.success('Departamento eliminado correctamente', { position: 'top-center' });
    } catch {
      return;
    }
  };

  return (
    <motion.div
      key="departments"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Toolbar */}
      <div className="flex justify-end">
        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Nuevo Departamento
        </Button>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDepartments.map(dept => {
          const deptStudents = allUsers.filter(u => u.departmentId === dept.id && u.role === UserRole.STUDENT).length;
          const deptHours = allLogs
            .filter(l => l.departmentId === dept.id && isDateInCycle(l.date, selectedCycle))
            .reduce((acc, l) => acc + l.hours, 0);
          const deptHead = allUsers.find(u => u.id === dept.headId);

          return (
            <div key={dept.id} className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-surface rounded-2xl group-hover:bg-primary group-hover:text-primary-fg transition-all">
                  <Building className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="icon-action" onClick={() => openEdit(dept)} title="Editar Departamento">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="icon-action"
                    onClick={() => handleDelete(dept)}
                    title="Eliminar Departamento"
                    className="hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h4 className="text-lg font-bold mb-1">{dept.name}</h4>
              <p className="text-xs text-faint mb-6">
                Jefe: <span className="text-foreground font-medium">{deptHead?.name || 'No asignado'}</span>
              </p>
              <p className="text-xs text-faint mb-6">
                Centro de costos: <span className="text-foreground font-semibold font-mono">{dept.costCenter}</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-faint mb-1">Estudiantes</p>
                  <p className="text-xl font-bold">{deptStudents}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-faint mb-1">Horas Ciclo</p>
                  <p className="text-xl font-bold">{deptHours.toFixed(1)}h</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Dept Modal */}
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
            placeholder="Ej. 12-3456"
            maxLength={7}
            required
            hint="Formato contable requerido: 2 digitos, guion, 4 digitos"
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
    </motion.div>
  );
};

export default AdminDepartmentsTab;
