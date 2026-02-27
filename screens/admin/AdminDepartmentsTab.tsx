import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Building, ChevronDown } from 'lucide-react';
import { User, WorkLog, Department, UserRole } from '../../types';
import { isDateInCycle } from '../../lib/business';
import { toast } from 'sonner';

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
        <button
          onClick={openAdd}
          className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Departamento</span>
        </button>
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
                <button
                  onClick={() => openEdit(dept)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
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
      <AnimatePresence>
        {isAddingDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">
                {editingDept ? 'Editar Departamento' : 'Nuevo Departamento'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Nombre del Departamento
                  </label>
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={e => setNewDeptName(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                    placeholder="Ej. Recursos Humanos"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
                    Jefe de Departamento
                  </label>
                  <div className="relative">
                    <select
                      value={newDeptHeadId}
                      onChange={e => setNewDeptHeadId(e.target.value)}
                      className="select-custom w-full py-3.5 px-5 pr-10"
                    >
                      <option value="">Sin Asignar</option>
                      {deptHeads.map(head => (
                        <option key={head.id} value={head.id}>{head.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingDept(false)}
                    className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                  >
                    {editingDept ? 'Guardar Cambios' : 'Crear Depto.'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDepartmentsTab;
