import React, { useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { motion } from 'motion/react';
import { Plus, ArrowRightLeft, UserMinus } from 'lucide-react';
import { User, Department } from '../../types';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { useAdminUsersData } from '../../hooks/useAdminUsersData';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Toolbar, Button, Badge, Modal, EmptyState } from '../../components/ui';

interface AdminStudentsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>, password?: string) => Promise<void> | void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  allUsers,
  allDepartments,
  updateUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
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
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} disabled title="Funcionalidad próximamente">
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
