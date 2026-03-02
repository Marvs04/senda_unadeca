import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, CheckSquare } from 'lucide-react';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog, Department } from '../../types';
import { Button } from '../../components/ui';

interface DeptHeadPendingSectionProps {
  pendingLogs: WorkLog[];
  onApproveAll: () => void;
  renderActions: (log: WorkLog) => React.ReactNode;
  allUsers: User[];
  allDepartments: Department[];
}

const DeptHeadPendingSection: React.FC<DeptHeadPendingSectionProps> = ({
  pendingLogs,
  onApproveAll,
  renderActions,
  allUsers,
  allDepartments,
}) => {
  if (pendingLogs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-card p-8 rounded-[2rem] border border-amber-100 shadow-sm shadow-amber-500/5 overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-amber-50 rounded-2xl">
            <CheckSquare className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Pendientes de Aprobación</h3>
            <p className="text-xs text-muted">Revisa y aprueba las horas de tus estudiantes</p>
          </div>
        </div>
        <Button variant="success" size="sm" icon={<CheckCircle className="h-4 w-4" />} onClick={onApproveAll}>
          Aprobar Todo
        </Button>
      </div>
      <WorkLogTable
        logs={pendingLogs}
        users={allUsers}
        departments={allDepartments}
        title=""
        showStudent
        actions={renderActions}
      />
    </motion.div>
  );
};

export default DeptHeadPendingSection;
