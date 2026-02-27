import React from 'react';
import { motion } from 'motion/react';
import { WorkLog, WorkLogStatus, User, Department, LIMITS } from '../types';
import { cn, truncate } from '../lib/utils';
import { STATUS_CONFIG } from '../lib/uiConfig';
import { Calendar, Clock, FileText, User as UserIcon, Building } from 'lucide-react';

interface WorkLogTableProps {
  logs: WorkLog[];
  users: User[];
  departments: Department[];
  title: string;
  showStudent?: boolean;
  showDepartment?: boolean;
  actions?: (log: WorkLog) => React.ReactNode;
  variant?: 'light' | 'dark';
}

const StatusBadge: React.FC<{ status: WorkLogStatus; rejectionReason?: string }> = ({ status, rejectionReason }) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={cn(
        "px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border",
        config.className
      )}>
        {config.label}
      </span>
      {status === WorkLogStatus.REJECTED && rejectionReason && (
        <span className="text-[9px] text-rose-500/70 font-medium italic max-w-[120px]" title={rejectionReason}>
          "{truncate(rejectionReason, 40)}"
        </span>
      )}
    </div>
  );
};

const WorkLogTable: React.FC<WorkLogTableProps> = ({ 
  logs, 
  users, 
  departments, 
  title, 
  showStudent = false, 
  showDepartment = false, 
  actions,
  variant = 'light'
}) => {
  const isDark = variant === 'dark';
  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'N/A';
  const getDepartmentName = (id: string) => departments.find(d => d.id === id)?.name || 'N/A';

  return (
    <div className={cn(
      "rounded-3xl border overflow-hidden transition-all duration-300",
      isDark 
        ? "bg-zinc-900 border-white/10 text-white" 
        : "bg-white border-zinc-100 text-zinc-900 shadow-sm"
    )}>
      <div className="px-6 py-5 border-b border-inherit flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-70 font-display">{title}</h3>
        <span className="text-[10px] font-bold px-2 py-1 bg-inherit border border-inherit rounded-lg opacity-50">
          {(logs || []).length} Registros
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
              "text-[10px] uppercase tracking-widest font-bold opacity-40",
              isDark ? "bg-white/5" : "bg-zinc-50"
            )}>
              {showStudent && <th className="px-6 py-3">Estudiante</th>}
              {showDepartment && <th className="px-6 py-3">Departamento</th>}
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Horas</th>
              <th className="px-6 py-3">Descripción</th>
              <th className="px-6 py-3">Estado</th>
              {actions && <th className="px-6 py-3 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-inherit">
            {(logs || []).length > 0 ? (logs || []).map((log, idx) => (
              <motion.tr 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={log.id} 
                className={cn(
                  "group transition-colors",
                  isDark ? "hover:bg-white/5" : "hover:bg-zinc-50"
                )}
              >
                {showStudent && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-500/10 flex items-center justify-center">
                        <UserIcon className="w-3 h-3 opacity-50" />
                      </div>
                      <span className="text-sm font-medium">{getUserName(log.studentId)}</span>
                    </div>
                  </td>
                )}
                {showDepartment && (
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                       <Building className="w-3 h-3 opacity-40" />
                       <span className="text-sm opacity-70">{getDepartmentName(log.departmentId)}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 text-sm opacity-70">
                    <Calendar className="w-3 h-3 opacity-40" />
                    <span>{new Date(log.date + 'T00:00:00').toLocaleDateString('es-CR', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 opacity-40" />
                    <span className="text-sm font-bold font-display">{log.hours}h</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2 max-w-xs">
                    <FileText className="w-3 h-3 opacity-40 flex-shrink-0" />
                    <span className="text-sm opacity-60" title={log.description}>{truncate(log.description, 60)}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={log.status} rejectionReason={log.rejectionReason} />
                </td>
                {actions && (
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center justify-end">
                      {actions(log)}
                    </div>
                  </td>
                )}
              </motion.tr>
            )) : (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center">
                  <p className="text-sm opacity-40 font-medium italic">No hay registros disponibles</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkLogTable;
