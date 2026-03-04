import React from 'react';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { User, WorkLog, LIMITS } from '../../types';
import { Modal, Button } from '../../components/ui';

interface DeptHeadRejectionModalProps {
  rejectingLog: WorkLog | null;
  rejectionReason: string;
  setRejectionReason: (v: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  allUsers: User[];
}

const DeptHeadRejectionModal: React.FC<DeptHeadRejectionModalProps> = ({
  rejectingLog,
  rejectionReason,
  setRejectionReason,
  onConfirm,
  onClose,
  allUsers,
}) => {
  return (
    <Modal open={!!rejectingLog} onClose={onClose}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-rose-50 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-600" />
        </div>
        <h3 className="text-xl font-bold">Rechazar Registro</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted">
          Por favor, indica la razón por la cual estás rechazando las{' '}
          <strong>{rejectingLog?.hours}h</strong> del estudiante{' '}
          <strong>{allUsers.find(u => u.id === rejectingLog?.studentId)?.name}</strong>.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-xs font-bold text-faint uppercase tracking-widest">
              Razón del Rechazo
            </label>
            <span className="text-[10px] font-bold text-border">
              {rejectionReason.length} / {LIMITS.REJECTION_REASON}
            </span>
          </div>
          <div className="relative">
            <MessageSquare className="w-4 h-4 absolute left-4 top-4 text-faint" />
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={3}
              maxLength={LIMITS.REJECTION_REASON}
              className="w-full bg-surface border border-border rounded-2xl py-4 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all text-sm"
              placeholder="Ej. Descripción insuficiente, horas incorrectas..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-8">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm}>Confirmar Rechazo</Button>
      </div>
    </Modal>
  );
};

export default DeptHeadRejectionModal;
