import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, Input, Select, EmptyState } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

interface AdminDeptHeadsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  deleteUser: (userId: string) => void;
}

const AdminDeptHeadsTab: React.FC<AdminDeptHeadsTabProps> = ({
  allUsers,
  allDepartments,
  addUser,
  deleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingDeptHead, setIsAddingDeptHead] = useState(false);
  const { confirm, dialogProps } = useConfirm();

  const { filteredHeads } = useAdminUsersData({ allUsers, studentSearch: '', deptHeadSearch: searchTerm });

  const handleAddDeptHead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
    const employeeNumber = (form.elements.namedItem('employeeNumber') as HTMLInputElement).value.trim();
    const departmentId = (form.elements.namedItem('departmentId') as HTMLSelectElement).value;

    if (!name || !employeeNumber) {
      toast.error('Por favor complete todos los campos');
      return;
    }

    addUser({ name, employeeNumber, departmentId: departmentId || undefined, role: UserRole.DEPT_HEAD });
    setIsAddingDeptHead(false);
    form.reset();
    toast.success('Jefe de Departamento creado exitosamente');
  };

  const handleDelete = async (head: User) => {
    const ok = await confirm(`¿Eliminar la cuenta de ${head.name}?`, { variant: 'danger', title: 'Eliminar cuenta' });
    if (!ok) return;
    deleteUser(head.id);
    toast.success('Cuenta eliminada correctamente');
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

      {/* Table */}
      <div className="bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-8 py-5">Nombre</th>
              <th className="px-8 py-5">Nº Empleado</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {filteredHeads.map(head => (
              <tr key={head.id} className="hover:bg-surface transition-colors">
                <td className="px-8 py-5 font-medium text-sm">{head.name}</td>
                <td className="px-8 py-5 text-sm text-muted font-mono">{head.employeeNumber || '---'}</td>
                <td className="px-8 py-5">
                  <Badge variant="neutral">
                    {allDepartments.find(d => d.id === head.departmentId)?.name || 'Sin Asignar'}
                  </Badge>
                </td>
                <td className="px-8 py-5 text-right">
                  <Button variant="icon-action" onClick={() => handleDelete(head)} title="Eliminar Cuenta" className="hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {filteredHeads.length === 0 && (
              <EmptyState colSpan={4} message="No se encontraron jefes de departamento" />
            )}
          </tbody>
        </table>
      </div>

      {/* Add Dept Head Modal */}
      <Modal
        open={isAddingDeptHead}
        onClose={() => setIsAddingDeptHead(false)}
        title="Nuevo Jefe de Departamento"
      >
        <form onSubmit={handleAddDeptHead} className="space-y-5">
          <Input label="Nombre Completo" name="name" placeholder="Ej. Juan Pérez" autoFocus />
          <Input label="Nº de Empleado" name="employeeNumber" placeholder="Ej. EMP-123" />
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

      <ConfirmDialog {...dialogProps} />
    </motion.div>
  );
};

export default AdminDeptHeadsTab;
