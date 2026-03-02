import React from 'react';
import { Users, Search, Lock, HelpCircle } from 'lucide-react';
import { User } from '../../types';
import { Input, Button } from '../../components/ui';

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
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center space-x-4 mb-8">
        <div className="p-3 bg-indigo-50 rounded-2xl">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">Ayuda a Estudiantes</h3>
          <p className="text-xs text-muted">
            Gestión de recuperación de contraseñas para alumnos
          </p>
        </div>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar estudiante por nombre o carnet..."
          value={studentSearch}
          onChange={e => setStudentSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
        {filteredStudents.map(student => (
          <div
            key={student.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-border-faint hover:border-border transition-all group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-faint group-hover:bg-primary group-hover:text-primary-fg transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold">{student.name}</p>
                <p className="text-[10px] font-mono text-faint">{student.carnet || '---'}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<Lock className="w-3 h-3" />}
              onClick={() => onResetPassword(student.name)}
            >
              Resetear Clave
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminStudentHelp;
