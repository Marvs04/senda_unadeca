import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, ChevronDown } from 'lucide-react';
import { User, Department, UserRole } from '../../types';
import { toast } from 'sonner';

interface AdminDeptHeadsTabProps {
  allUsers: User[];
  allDepartments: Department[];
  addUser: (newUser: Omit<User, 'id'>) => void;
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

  const filteredHeads = allUsers.filter(
    u => u.role === UserRole.DEPT_HEAD &&
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = (head: User) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la cuenta de ${head.name}?`)) {
      deleteUser(head.id);
      toast.success('Cuenta eliminada correctamente');
    }
  };

  return (
    <motion.div
      key="dept-heads"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar jefe de departamento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all"
          />
        </div>
        <button
          onClick={() => setIsAddingDeptHead(true)}
          className="px-6 py-3.5 bg-zinc-900 text-white rounded-2xl text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center space-x-2 shadow-xl shadow-zinc-900/10"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Jefe Depto.</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400">
            <tr>
              <th className="px-8 py-5">Nombre</th>
              <th className="px-8 py-5">Nº Empleado</th>
              <th className="px-8 py-5">Departamento</th>
              <th className="px-8 py-5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredHeads.map(head => (
              <tr key={head.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-8 py-5 font-medium text-sm">{head.name}</td>
                <td className="px-8 py-5 text-sm text-zinc-500 font-mono">{head.employeeNumber || '---'}</td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-zinc-100 rounded-lg text-xs font-medium text-zinc-600">
                    {allDepartments.find(d => d.id === head.departmentId)?.name || 'Sin Asignar'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button
                    onClick={() => handleDelete(head)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Eliminar Cuenta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filteredHeads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-sm text-zinc-400 italic">
                  No se encontraron jefes de departamento
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Dept Head Modal */}
      <AnimatePresence>
        {isAddingDeptHead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Nuevo Jefe de Departamento</h3>
              <form onSubmit={handleAddDeptHead} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                    placeholder="Ej. Juan Pérez"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Nº de Empleado</label>
                  <input
                    name="employeeNumber"
                    type="text"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-3.5 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
                    placeholder="Ej. EMP-123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Departamento</label>
                  <div className="relative">
                    <select name="departmentId" className="select-custom w-full py-3.5 px-5 pr-10">
                      <option value="">Sin Asignar</option>
                      {allDepartments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setIsAddingDeptHead(false)}
                    className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-4 bg-zinc-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
                  >
                    Crear Cuenta
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

export default AdminDeptHeadsTab;
