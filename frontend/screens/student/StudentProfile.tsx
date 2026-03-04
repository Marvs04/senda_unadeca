import React from 'react';
import { Zap } from 'lucide-react';
import { User, WorkLog } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface StudentProfileProps {
  user: User;
  myLogs: WorkLog[];
  currentRate: number;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ user, myLogs, currentRate }) => {
  const totalHours = (myLogs || []).reduce((acc, l) => acc + l.hours, 0);

  return (
    <div className="mb-12 relative z-0">
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-[3.5rem] shadow-2xl shadow-zinc-900/20" />
      <div className="relative z-10 px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center space-x-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-dark-hover border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
              {user.name?.charAt(0)}
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-dark flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight mb-2">{user.name}</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-faint">
                {user.carnet || 'Sin Carnet'}
              </span>
              <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Estudiante Activo
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-12 px-10 py-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
              Horas Totales
            </p>
            <p className="text-2xl font-black text-white">{totalHours.toFixed(1)}h</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-1">
              Tarifa Actual
            </p>
            <p className="text-2xl font-black text-white">{formatCurrency(currentRate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
