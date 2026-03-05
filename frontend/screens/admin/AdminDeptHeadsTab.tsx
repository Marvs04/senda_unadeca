import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Edit2, Power } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, Input, Select, EmptyState } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

const INSTITUTIONAL_EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

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
    if (institutionalEmail && !INSTITUTIONAL_EMAIL_REGEX.test(institutionalEmail)) {
      toast.error('Correo institucional invalido.');
      return;
    }

    try {
      await addUser({
        name,
        employeeNumber,
        institutionalEmail: institutionalEmail || undefined,
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
      toast.error('Correo institucional invalido.');
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
            {filteredHeads.map(head => (
              <tr key={head.id} className="hover:bg-surface transition-colors">
                <td className="px-8 py-5 font-medium text-sm">{head.name}</td>
                <td className="px-8 py-5 text-sm text-muted font-mono">{head.employeeNumber || '---'}</td>
                <td className="px-8 py-5 text-sm text-muted">{head.institutionalEmail || '---'}</td>
                <td className="px-8 py-5">
                  <Badge variant="neutral">
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
            {filteredHeads.length === 0 && (
              <EmptyState colSpan={6} message="No se encontraron jefes de departamento" />
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
          <Input label="Nombre Completo" name="name" placeholder="Ej. Juan Perez" autoFocus required />
          <Input label="Nº de Empleado" name="employeeNumber" placeholder="Ej. EMP-123" required />
          <Input label="Correo Institucional (opcional)" name="institutionalEmail" type="email" placeholder="ejemplo@unadeca.ac.cr" />
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
            label="Correo Institucional (opcional)"
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
