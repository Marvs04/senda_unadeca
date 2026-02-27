import React from 'react';
import { Clock, Calendar, Plus, ChevronDown } from 'lucide-react';
import { User, LIMITS } from '../../types';

interface DeptHeadLogFormProps {
  myStudents: User[];
  selectedStudent: string;
  setSelectedStudent: (v: string) => void;
  hours: string;
  setHours: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DeptHeadLogForm: React.FC<DeptHeadLogFormProps> = ({
  myStudents,
  selectedStudent,
  setSelectedStudent,
  hours,
  setHours,
  description,
  setDescription,
  date,
  setDate,
  onSubmit,
}) => {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-zinc-100 rounded-xl">
          <Plus className="w-4 h-4 text-zinc-600" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Registrar Horas</h3>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
            Estudiante
          </label>
          <div className="relative">
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="select-custom w-full py-3.5 px-5 pr-10"
            >
              {myStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
            Fecha
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
            Cantidad de Horas
          </label>
          <div className="relative">
            <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              step="0.5"
              min="0"
              className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm"
              placeholder="Ej. 4.5"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
              Descripción
            </label>
            <span className="text-[10px] font-bold text-zinc-300">
              {description.length} / {LIMITS.DESCRIPTION}
            </span>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={LIMITS.DESCRIPTION}
            className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm placeholder:text-zinc-400"
            placeholder="¿Qué tareas realizó el estudiante?"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-zinc-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95"
        >
          Registrar y Aprobar
        </button>
      </form>
    </div>
  );
};

export default DeptHeadLogForm;
