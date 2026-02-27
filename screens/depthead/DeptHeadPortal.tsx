import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  History,
  Calendar,
  FileText,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { Button } from '../../components/ui';
import DashboardCard from '../../components/DashboardCard';
import WorkLogTable from '../../components/WorkLogTable';
import { User, WorkLog, WorkLogStatus, Department, LIMITS } from '../../types';
import { exportToCSV, exportToPDF, formatCurrency } from '../../lib/utils';
import { getBillingCycle, isDateInCycle } from '../../lib/business';
import { useConfirm } from '../../hooks/useConfirm';
import { useDeptHeadData } from '../../hooks/useDeptHeadData';
import { type KioskActions } from '../../hooks/useKiosk';
import ConfirmDialog from '../../components/ConfirmDialog';
import DeptHeadPendingSection from './DeptHeadPendingSection';
import DeptHeadLogForm from './DeptHeadLogForm';
import DeptHeadRejectionModal from './DeptHeadRejectionModal';

interface DeptHeadPortalProps {
  user: User;
  onLogout: () => void;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  updateWorkLogStatus: (logId: string, newStatus: WorkLogStatus, reason?: string) => void;
  updateMultipleWorkLogsStatus: (updates: { logId: string; status: WorkLogStatus }[]) => void;
  addWorkLog: (newLogData: Omit<WorkLog, 'id' | 'status'>, status?: WorkLogStatus) => void;
  billingCycle: string;
  currentRate: number;
  onActivateKiosk: (identifier: string, password: string) => { ok: boolean; error?: string };
}

const DeptHeadPortal: React.FC<DeptHeadPortalProps> = ({
  user,
  onLogout,
  allLogs,
  allUsers,
  allDepartments,
  updateWorkLogStatus,
  updateMultipleWorkLogsStatus,
  onActivateKiosk,
  addWorkLog,
  billingCycle: initialBillingCycle,
  currentRate,
}) => {
  const [selectedCycle, setSelectedCycle] = useState(initialBillingCycle);
  const [kioskId, setKioskId]     = useState('');
  const [kioskPass, setKioskPass] = useState('');
  const [showKioskModal, setShowKioskModal] = useState(false);

  const handleActivateKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onActivateKiosk(kioskId.trim(), kioskPass.trim());
    if (!result.ok) { toast.error(result.error ?? 'Error al activar kiosco.', { position: 'top-center' }); return; }
    toast.success('Kiosco activado correctamente.', { position: 'top-center' });
    setShowKioskModal(false);
    setKioskId('');
    setKioskPass('');
  };

  const departmentName =
    (allDepartments || []).find(d => d.id === user.departmentId)?.name || 'N/A';

  const { myLogs, pendingLogs, myStudents, totalHours, pendingHours, approvedHours, totalBilling } =
    useDeptHeadData({
      departmentId: user.departmentId,
      allLogs,
      allUsers,
      selectedCycle,
      currentRate,
    });

  // Form state
  const [selectedStudent, setSelectedStudent] = useState(myStudents[0]?.id || '');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Rejection state
  const [rejectingLog, setRejectingLog] = useState<WorkLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { confirm, dialogProps } = useConfirm();

  const handleApproveAll = async () => {
    const ok = await confirm(
      `¿Aprobar los ${pendingLogs.length} registros pendientes?`,
      { title: 'Aprobar todos', confirmLabel: 'Aprobar todo' },
    );
    if (!ok) return;
    const updates = pendingLogs.map(log => ({ logId: log.id, status: WorkLogStatus.APPROVED }));
    if (updates.length > 0) {
      updateMultipleWorkLogsStatus(updates);
      toast.success('Todos los registros han sido aprobados', { position: 'top-center' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !hours || !description || !date) {
      toast.error('Por favor complete todos los campos.', { position: 'top-center' });
      return;
    }
    if (description.length > LIMITS.DESCRIPTION) {
      toast.error(`La descripción no puede exceder los ${LIMITS.DESCRIPTION} caracteres.`, {
        position: 'top-center',
      });
      return;
    }
    addWorkLog(
      {
        studentId: selectedStudent,
        departmentId: user.departmentId!,
        date,
        hours: parseFloat(hours),
        description,
      },
      WorkLogStatus.APPROVED,
    );
    setHours('');
    setDescription('');
    toast.success('Horas registradas y aprobadas correctamente', { position: 'top-center' });
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      toast.error('Debes proporcionar una razón para el rechazo.', { position: 'top-center' });
      return;
    }
    if (rejectionReason.length > LIMITS.REJECTION_REASON) {
      toast.error(
        `La razón del rechazo no puede exceder los ${LIMITS.REJECTION_REASON} caracteres.`,
        { position: 'top-center' },
      );
      return;
    }
    if (rejectingLog) {
      updateWorkLogStatus(rejectingLog.id, WorkLogStatus.REJECTED, rejectionReason);
      setRejectingLog(null);
      setRejectionReason('');
      toast.info('Registro rechazado', { position: 'top-center' });
    }
  };

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Estudiante', 'Fecha', 'Horas', 'Descripción', 'Estado', 'Razón Rechazo'];
    const rows = (myLogs || []).map(log => [
      (allUsers || []).find(u => u.id === log.studentId)?.name || 'N/A',
      log.date,
      log.hours,
      log.description,
      log.status,
      log.rejectionReason || '',
    ]);
    if (type === 'csv') {
      exportToCSV(`reporte_${departmentName.replace(/\s+/g, '_')}.csv`, headers, rows);
    } else {
      exportToPDF(
        `reporte_${departmentName.replace(/\s+/g, '_')}.pdf`,
        `Reporte de Horas - ${departmentName}`,
        headers,
        rows,
      );
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  const renderActions = (log: WorkLog) => {
    if (log.status === WorkLogStatus.PENDING) {
      return (
        <div className="flex space-x-2">
          <Button
            variant="icon-action"
            className="text-emerald-600 hover:bg-emerald-50"
            title="Aprobar"
            onClick={() => {
              updateWorkLogStatus(log.id, WorkLogStatus.APPROVED);
              toast.success('Registro aprobado', { position: 'top-center' });
            }}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button
            variant="icon-action"
            className="text-rose-600 hover:bg-rose-50"
            title="Rechazar"
            onClick={() => setRejectingLog(log)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <PortalLayout user={user} onLogout={onLogout} bg="bg-zinc-50 selection:bg-emerald-100">
        {/* Header + cycle picker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
            <div className="flex items-center space-x-3">
              <div className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded-md">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                  Departamento
                </span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">
                {departmentName}
              </h2>
            </div>
            <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              icon={<Clock className="h-4 w-4 text-emerald-600" />}
              onClick={() => setShowKioskModal(true)}
            >
              Activar Kiosco
            </Button>
          <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
              <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
              <div className="relative">
                <select
                  value={selectedCycle}
                  onChange={e => setSelectedCycle(e.target.value)}
                  className="select-custom pr-10 border-none bg-transparent"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - i);
                    const cycle = getBillingCycle(d);
                    return (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
          </div>
          <p className="text-zinc-500 text-sm">
            Gestión de horas para el ciclo:{' '}
            <span className="font-bold text-zinc-900">{getBillingCycle(selectedCycle).label}</span>
          </p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <DashboardCard title="Estudiantes" value={myStudents.length} icon={<Users className="h-5 w-5" />} />
          <DashboardCard title="Horas Ciclo" value={totalHours.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
          <DashboardCard title="Pendientes" value={pendingHours.toLocaleString()} icon={<Clock className="h-5 w-5 text-amber-500" />} />
          <DashboardCard title="Aprobadas" value={approvedHours.toLocaleString()} icon={<CheckCircle className="h-5 w-5 text-emerald-500" />} />
          <DashboardCard
            title="Facturación"
            value={formatCurrency(totalBilling)}
            icon={<DollarSign className="h-5 w-5 text-indigo-500" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence>
              <DeptHeadPendingSection
                pendingLogs={pendingLogs}
                onApproveAll={handleApproveAll}
                renderActions={renderActions}
                allUsers={allUsers}
                allDepartments={allDepartments}
              />
            </AnimatePresence>

            {/* History */}
            <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-zinc-100 rounded-2xl">
                    <History className="w-5 h-5 text-zinc-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">Historial del Departamento</h3>
                    <p className="text-xs text-zinc-500">Registros aprobados y procesados</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="icon-action" onClick={() => handleExport('csv')} title="Exportar CSV">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="primary" size="sm" icon={<FileText className="h-4 w-4" />} onClick={() => handleExport('pdf')}>
                    Exportar PDF
                  </Button>
                </div>
              </div>
              <WorkLogTable
                logs={myLogs.filter(
                  l =>
                    l.status !== WorkLogStatus.PENDING && isDateInCycle(l.date, selectedCycle),
                )}
                users={allUsers}
                departments={allDepartments}
                title=""
                showStudent
              />
            </div>
          </div>

          {/* Log Form — sticky */}
          <div className="lg:col-span-4 sticky top-28">
            <DeptHeadLogForm
              myStudents={myStudents}
              selectedStudent={selectedStudent}
              setSelectedStudent={setSelectedStudent}
              hours={hours}
              setHours={setHours}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      <DeptHeadRejectionModal
        rejectingLog={rejectingLog}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onConfirm={handleConfirmReject}
        onClose={() => {
          setRejectingLog(null);
          setRejectionReason('');
        }}
        allUsers={allUsers}
      />
      <ConfirmDialog {...dialogProps} />

      {/* Kiosk activate modal */}
      {showKioskModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowKioskModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900">Activar kiosco</h3>
                <p className="text-xs text-zinc-500">{departmentName}</p>
              </div>
            </div>
            <form onSubmit={handleActivateKiosk} className="flex flex-col gap-3">
              <input type="text" placeholder="Número de empleado"
                value={kioskId} onChange={e => setKioskId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <input type="password" placeholder="Contraseña"
                value={kioskPass} onChange={e => setKioskPass(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowKioskModal(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors">Activar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};

export default DeptHeadPortal;
