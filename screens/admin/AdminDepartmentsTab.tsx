import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Edit2, Building } from 'lucide-react';
import { User, WorkLog, Department, UserRole } from '../../types';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';
import { Button, Modal, Input, Select, EmptyState } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

interface AdminDepartmentsTabProps {
  allDepartments: Department[];
  allUsers: User[];
  allLogs: WorkLog[];
  selectedCycle: string;
  addDepartment: (newDepartment: Omit<Department, 'id'>) => void;
  updateDepartment: (deptId: string, updates: Partial<Department>) => void;
}

const AdminDepartmentsTab: React.FC<AdminDepartmentsTabProps> = ({
  allDepartments,
  allUsers,
  allLogs,
  selectedCycle,
  addDepartment,
  updateDepartment,
}) => {
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHeadId, setNewDeptHeadId] = useState('');

  const openAdd = () => {
    setEditingDept(null);
    setNewDeptName('');
    setNewDeptHeadId('');
    setIsAddingDept(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.name);
    setNewDeptHeadId(dept.headId || '');
    setIsAddingDept(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    if (editingDept) {
      updateDepartment(editingDept.id, { name: newDeptName, headId: newDeptHeadId || undefined });
      toast.success('Departamento actualizado exitosamente', { position: 'top-center' });
    } else {
      addDepartment({ name: newDeptName, headId: newDeptHeadId || undefined });
      toast.success('Departamento creado exitosamente', { position: 'top-center' });
    }

    setIsAddingDept(false);
    setNewDeptName('');
    setNewDeptHeadId('');
    setEditingDept(null);
  };

  const deptHeads = allUsers.filter(u => u.role === UserRole.DEPT_HEAD);

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
            <div key={dept.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-zinc-100 rounded-2xl group-hover:bg-zinc-900 group-hover:text-white transition-all">
                  <Building className="w-5 h-5" />
                </div>
                <Button variant="icon-action" onClick={() => openEdit(dept)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
              <h4 className="text-lg font-bold mb-1">{dept.name}</h4>
              <p className="text-xs text-zinc-400 mb-6">
                Jefe: <span className="text-zinc-900 font-medium">{deptHead?.name || 'No asignado'}</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Estudiantes</p>
                  <p className="text-xl font-bold">{deptStudents}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Horas Ciclo</p>
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
    </motion.div>
  );
};

export default AdminDepartmentsTab;
