import React from 'react';
import { Clock, Calendar, Plus } from 'lucide-react';
import { User, LIMITS } from '../../types';
import { Select, Input, Button } from '../../components/ui';

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
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="icon-box">
          <Plus className="w-4 h-4" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">Registrar Horas</h3>
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <Select
          label="Estudiante"
          value={selectedStudent}
          onChange={e => setSelectedStudent(e.target.value)}
          options={myStudents.map(s => ({ value: s.id, label: s.name }))}
        />

        <Input
          label="Fecha"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          icon={<Calendar className="w-4 h-4" />}
        />

        <Input
          label="Cantidad de Horas"
          type="number"
          value={hours}
          onChange={e => setHours(e.target.value)}
          step="0.5"
          min="0"
          placeholder="Ej. 4.5"
          icon={<Clock className="w-4 h-4" />}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-faint uppercase tracking-widest">
              Descripción
            </label>
            <span className="text-[10px] font-bold text-border">
              {description.length} / {LIMITS.DESCRIPTION}
            </span>
          </div>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            maxLength={LIMITS.DESCRIPTION}
            className="w-full bg-surface border-border rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-primary/5 transition-all text-sm placeholder:text-faint"
            placeholder="¿Qué tareas realizó el estudiante?"
          />
        </div>

        <Button type="submit" variant="primary" className="w-full">
          Registrar y Aprobar
        </Button>
      </form>
    </div>
  );
};

export default DeptHeadLogForm;
