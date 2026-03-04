import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion } from 'motion/react';
import { Plus, ArrowRightLeft, UserMinus } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, EmptyState, Input, Select } from '../../components/ui';
import type { SelectOption } from '../../components/ui';

interface AdminStudentsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  allUsers,
  allDepartments,
  addUser,
  updateUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCarnet, setNewStudentCarnet] = useState('');
  const [newStudentDepartmentId, setNewStudentDepartmentId] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const { filteredStudents } = useAdminUsersData({ allUsers, studentSearch: debouncedSearch, deptHeadSearch: '' });

  const handleUpdateStudentDept = (studentId: string, deptId: string | undefined) => {
    updateUser(studentId, { departmentId: deptId });
    toast.success('Departamento actualizado correctamente', { position: 'top-center' });
    setEditingStudent(null);
  };

  const handleRemoveFromDept = async (student: User) => {
    const ok = await confirm(`¿Quitar a ${student.name} de su departamento?`, { variant: 'danger', title: 'Quitar del departamento' });
    if (!ok) return;
    handleUpdateStudentDept(student.id, undefined);
  };

  const resetStudentForm = () => {
    setNewStudentName('');
    setNewStudentCarnet('');
    setNewStudentDepartmentId('');
    setNewStudentPassword('');
  };

  const handleCreateStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newStudentName.trim();
    const carnet = newStudentCarnet.trim();

    if (!name || !carnet) {
      toast.error('Nombre y carnet son requeridos.');
      return;
    }

    try {
      await addUser(
        {
          name,
          carnet,
          role: UserRole.STUDENT,
          departmentId: newStudentDepartmentId || undefined,
        },
        newStudentPassword.trim() || undefined,
      );

      toast.success('Estudiante creado exitosamente', { position: 'top-center' });
      setIsAddingStudent(false);
      resetStudentForm();
    } catch {
      return;
    }
  };

  const departmentOptions: SelectOption[] = [
    { value: '', label: 'Sin Asignar' },
    ...allDepartments.map(d => ({ value: d.id, label: d.name })),
  ];

  return (
    <motion.div
      key="students"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <Toolbar
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por nombre o carnet..."
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsAddingStudent(true)}>
            Nuevo Estudiante
          </Button>
        }
      />

      {/* Table */}
      <div className="bg-card rounded-[2.5rem] border border-border-faint shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-8 py-5">Estudiante</th>
              <th className="px-8 py-5">Carnet</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-surface transition-colors group">
                <td className="px-8 py-5 font-medium text-sm">{student.name}</td>
                <td className="px-8 py-5 text-sm text-muted font-mono">{student.carnet || '---'}</td>
                <td className="px-8 py-5">
                  <Badge variant="neutral">
                    {allDepartments.find(d => d.id === student.departmentId)?.name || 'Sin Asignar'}
                  </Badge>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="icon-action" onClick={() => setEditingStudent(student)} title="Cambiar Departamento">
                      <ArrowRightLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="icon-action" onClick={() => handleRemoveFromDept(student)} title="Quitar de Departamento" className="hover:text-rose-600 hover:bg-rose-50">
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <EmptyState colSpan={4} message="No se encontraron estudiantes" />
            )}
          </tbody>
        </table>
      </div>

      {/* Change Dept Modal */}
      <Modal
        open={isAddingStudent}
        onClose={() => {
          setIsAddingStudent(false);
          resetStudentForm();
        }}
        title="Nuevo Estudiante"
      >
        <form onSubmit={handleCreateStudent} className="space-y-5">
          <Input
            label="Nombre Completo"
            value={newStudentName}
            onChange={e => setNewStudentName(e.target.value)}
            placeholder="Ej. María Gómez"
            autoFocus
          />
          <Input
            label="Carnet"
            value={newStudentCarnet}
            onChange={e => setNewStudentCarnet(e.target.value)}
            placeholder="Ej. 20240001"
          />
          <Select
            label="Departamento"
            value={newStudentDepartmentId}
            onChange={e => setNewStudentDepartmentId(e.target.value)}
            options={departmentOptions}
          />
          <Input
            label="Contraseña Temporal (opcional)"
            type="password"
            value={newStudentPassword}
            onChange={e => setNewStudentPassword(e.target.value)}
            placeholder="Si se deja vacío, se usa el carnet"
          />
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAddingStudent(false);
                resetStudentForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Crear Cuenta
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        title="Cambiar Departamento"
        subtitle={editingStudent ? `Selecciona el nuevo departamento para ${editingStudent.name}` : ''}
      >
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
          {allDepartments.map(dept => (
            <button
              key={dept.id}
              onClick={() => handleUpdateStudentDept(editingStudent!.id, dept.id)}
              className="w-full p-4 text-left rounded-2xl border border-border-faint hover:border-foreground hover:bg-surface transition-all flex items-center justify-between group"
            >
              <span className="font-medium text-sm">{dept.name}</span>
              <ArrowRightLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
        <Button variant="ghost" className="w-full mt-4" onClick={() => setEditingStudent(null)}>
          Cancelar
        </Button>
      </Modal>

      <ConfirmDialog {...dialogProps} />
    </motion.div>
  );
};

export default AdminStudentsTab;
