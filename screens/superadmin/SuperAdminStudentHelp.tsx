import React from 'react';
import { Users, Search, Lock, HelpCircle } from 'lucide-react';
import { User } from '../../types';

interface SuperAdminStudentHelpProps {
  filteredStudents: User[];
  studentSearch: string;
  setStudentSearch: (v: string) => void;
  onResetPassword: (name: string) => void;
}

const SuperAdminStudentHelp: React.FC<SuperAdminStudentHelpProps> = ({
  filteredStudents,
  studentSearch,
  setStudentSearch,
  onResetPassword,
}) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Ayuda a Estudiantes</h3>
          <p className="text-xs text-zinc-500">
            Gestión de recuperación de contraseñas para alumnos
          </p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar estudiante por nombre o carnet..."
          value={studentSearch}
          onChange={e => setStudentSearch(e.target.value)}
          className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-zinc-50 hover:border-zinc-200 transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{student.name}</p>
                <p className="text-[10px] font-mono text-zinc-400">{student.carnet || '---'}</p>
              </div>
            </div>
            <button
              onClick={() => onResetPassword(student.name)}
              className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all flex items-center space-x-2"
            >
              <Lock className="w-3 h-3" />
              <span>Resetear Clave</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminStudentHelp;
