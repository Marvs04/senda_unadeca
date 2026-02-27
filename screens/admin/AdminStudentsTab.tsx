import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, ArrowRightLeft, UserMinus } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';

interface AdminStudentsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

const AdminStudentsTab: React.FC<AdminStudentsTabProps> = ({
  allUsers,
  allDepartments,
  updateUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<User | null>(null);

  const filteredStudents = useMemo(() =>
    allUsers.filter(u =>
      u.role === UserRole.STUDENT &&
      ((u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.carnet?.includes(searchTerm))
    ),
    [allUsers, searchTerm]
  );

  const handleUpdateStudentDept = (studentId: string, deptId: string | undefined) => {
    updateUser(studentId, { departmentId: deptId });
    toast.success('Departamento actualizado correctamente', { position: 'top-center' });
    setEditingStudent(null);
  };

  const handleRemoveFromDept = (student: User) => {
    if (window.confirm(`¿Confirmas que deseas quitar a ${student.name} de su departamento?`)) {
      handleUpdateStudentDept(student.id, undefined);
    }
  };

  return (
    <motion.div
      key="students"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o carnet..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
          />
        </div>
        <button
          className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10 opacity-50 cursor-not-allowed"
          disabled
          title="Funcionalidad próximamente"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Estudiante</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            <tr>
              <th className="px-8 py-5">Estudiante</th>
              <th className="px-8 py-5">Carnet</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-8 py-5 font-medium text-sm">{student.name}</td>
                <td className="px-8 py-5 text-sm text-zinc-500 font-mono">{student.carnet || '---'}</td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-600">
                    {allDepartments.find(d => d.id === student.departmentId)?.name || 'Sin Asignar'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                      title="Cambiar Departamento"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFromDept(student)}
                      className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Quitar de Departamento"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-sm text-zinc-400 italic">
                  No se encontraron estudiantes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Change Dept Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-2">Cambiar Departamento</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Selecciona el nuevo departamento para <strong>{editingStudent.name}</strong>
              </p>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {allDepartments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => handleUpdateStudentDept(editingStudent.id, dept.id)}
                    className="w-full p-4 text-left rounded-2xl border border-zinc-100 hover:border-zinc-900 hover:bg-zinc-50 transition-all flex items-center justify-between group"
                  >
                    <span className="font-medium text-sm">{dept.name}</span>
                    <ArrowRightLeft className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="w-full mt-6 py-3 text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminStudentsTab;
