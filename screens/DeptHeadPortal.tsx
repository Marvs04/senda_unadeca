import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Download, 
  Plus,
  History,
  CheckSquare,
  Filter,
  Calendar,
  FileText,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  DollarSign,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../components/Header';
import DashboardCard from '../components/DashboardCard';
import WorkLogTable from '../components/WorkLogTable';
import { User, UserRole, WorkLog, WorkLogStatus, Department, LIMITS } from '../types';
import { cn, exportToCSV, exportToPDF, formatCurrency } from '../lib/utils';
import { getBillingCycle, isDateInCycle } from '../lib/business';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

interface DeptHeadPortalProps {
  user: User;
  onLogout: () => void;
  allLogs: WorkLog[];
  allUsers: User[];
  allDepartments: Department[];
  updateWorkLogStatus: (logId: string, newStatus: WorkLogStatus, reason?: string) => void;
  updateMultipleWorkLogsStatus: (updates: { logId: string, status: WorkLogStatus }[]) => void;
  addWorkLog: (newLogData: Omit<WorkLog, 'id' | 'status'>, status?: WorkLogStatus) => void;
  billingCycle: string;
  currentRate: number;
}

const DeptHeadPortal: React.FC<DeptHeadPortalProps> = ({ 
  user, 
  onLogout, 
  allLogs, 
  allUsers, 
  allDepartments, 
  updateWorkLogStatus, 
  updateMultipleWorkLogsStatus, 
  addWorkLog,
  billingCycle: initialBillingCycle,
  currentRate
}) => {
  const [selectedCycle, setSelectedCycle] = useState(initialBillingCycle);
  const departmentName = (allDepartments || []).find(d => d.id === user.departmentId)?.name || 'N/A';
  
  const myLogs = useMemo(() => {
     return (allLogs || []).filter(log => log.departmentId === user.departmentId);
  }, [user.departmentId, allLogs]);

  const { myStudents, totalHours, pendingHours, approvedHours, totalBilling } = useMemo(() => {
    const myStudents = (allUsers || []).filter(u => u.role === UserRole.STUDENT && u.departmentId === user.departmentId);
    const cycleLogs = myLogs.filter(log => isDateInCycle(log.date, selectedCycle));
    
    const totalHours = cycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const pendingHours = cycleLogs.filter(log => log.status === WorkLogStatus.PENDING).reduce((acc, log) => acc + log.hours, 0);
    const approvedHours = cycleLogs.filter(log => log.status === WorkLogStatus.APPROVED).reduce((acc, log) => acc + log.hours, 0);
    const totalBilling = approvedHours * currentRate;
    return { myStudents, totalHours, pendingHours, approvedHours, totalBilling };
  }, [user.departmentId, allUsers, myLogs, selectedCycle, currentRate]);
  
  const pendingLogs = myLogs.filter(log => log.status === WorkLogStatus.PENDING);

  const [selectedStudent, setSelectedStudent] = useState(myStudents[0]?.id || '');
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Rejection State
  const [rejectingLog, setRejectingLog] = useState<WorkLog | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { confirm, dialogProps } = useConfirm();

  const handleApproveAll = async () => {
    const ok = await confirm(`¿Aprobar los ${pendingLogs.length} registros pendientes?`, { title: 'Aprobar todos', confirmLabel: 'Aprobar todo' });
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
        toast.error(`La descripción no puede exceder los ${LIMITS.DESCRIPTION} caracteres.`, { position: 'top-center' });
        return;
    }
    addWorkLog({
        studentId: selectedStudent,
        departmentId: user.departmentId!,
        date,
        hours: parseFloat(hours),
        description,
    }, WorkLogStatus.APPROVED);
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
        toast.error(`La razón del rechazo no puede exceder los ${LIMITS.REJECTION_REASON} caracteres.`, { position: 'top-center' });
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
        log.rejectionReason || ''
    ]);

    if (type === 'csv') {
        exportToCSV(`reporte_${departmentName.replace(' ', '_')}.csv`, headers, rows);
    } else {
        exportToPDF(`reporte_${departmentName.replace(' ', '_')}.pdf`, `Reporte de Horas - ${departmentName}`, headers, rows);
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  const renderActions = (log: WorkLog) => {
    if (log.status === WorkLogStatus.PENDING) {
      return (
        <div className="flex space-x-2">
          <button 
            onClick={() => {
                updateWorkLogStatus(log.id, WorkLogStatus.APPROVED);
                toast.success('Registro aprobado', { position: 'top-center' });
            }} 
            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" 
            title="Aprobar"
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setRejectingLog(log)} 
            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors" 
            title="Rechazar"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-50 selection:bg-emerald-100">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />
      
      <main className="page-container py-10">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                <div className="flex items-center space-x-3">
                    <div className="px-2 py-0.5 bg-emerald-100 border border-emerald-200 rounded-md">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Departamento</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 font-display">{departmentName}</h2>
                </div>
                <div className="flex items-center space-x-3 bg-white p-1.5 rounded-2xl border border-zinc-100 shadow-sm">
                    <Calendar className="w-4 h-4 text-zinc-400 ml-2" />
                    <div className="relative">
                        <select 
                            value={selectedCycle}
                            onChange={(e) => setSelectedCycle(e.target.value)}
                            className="select-custom pr-10 border-none bg-transparent"
                        >
                            {Array.from({length: 12}, (_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const cycle = getBillingCycle(d);
                                return <option key={cycle.value} value={cycle.value}>{cycle.label}</option>;
                            })}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    </div>
                </div>
            </div>
            <p className="text-zinc-500 text-sm">Gestión de horas para el ciclo: <span className="font-bold text-zinc-900">{getBillingCycle(selectedCycle).label}</span></p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <DashboardCard title="Estudiantes" value={myStudents.length} icon={<Users className="h-5 w-5"/>} />
          <DashboardCard title="Horas Ciclo" value={totalHours.toLocaleString()} icon={<Clock className="h-5 w-5"/>} />
          <DashboardCard title="Pendientes" value={pendingHours.toLocaleString()} icon={<Clock className="h-5 w-5 text-amber-500"/>} />
          <DashboardCard title="Aprobadas" value={approvedHours.toLocaleString()} icon={<CheckCircle className="h-5 w-5 text-emerald-500"/>} />
          <DashboardCard 
            title="Facturación" 
            value={formatCurrency(totalBilling)} 
            icon={<DollarSign className="h-5 w-5 text-indigo-500"/>}
            trend={{ value: "Total Aprobado", isPositive: true }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
                 <AnimatePresence>
                    {pendingLogs.length > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white p-8 rounded-[2rem] border border-amber-100 shadow-sm shadow-amber-500/5 overflow-hidden"
                        >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-amber-50 rounded-2xl">
                                        <CheckSquare className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold tracking-tight">Pendientes de Aprobación</h3>
                                        <p className="text-xs text-zinc-500">Revisa y aprueba las horas de tus estudiantes</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleApproveAll}
                                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10 flex items-center space-x-2"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Aprobar Todo</span>
                                </button>
                            </div>
                            <WorkLogTable logs={pendingLogs} users={allUsers} departments={allDepartments} title="" showStudent actions={renderActions}/>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                            <button 
                                onClick={() => handleExport('csv')} 
                                className="p-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl transition-all"
                                title="Exportar CSV"
                            >
                                <Download className="h-4 w-4" />
                            </button>
                            <button 
                                onClick={() => handleExport('pdf')} 
                                className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center space-x-2"
                            >
                                <FileText className="h-4 w-4" />
                                <span>Exportar PDF</span>
                            </button>
                        </div>
                    </div>
                    <WorkLogTable logs={myLogs.filter(l => l.status !== WorkLogStatus.PENDING && isDateInCycle(l.date, selectedCycle))} users={allUsers} departments={allDepartments} title="" showStudent/>
                </div>
            </div>

            <div className="lg:col-span-4 sticky top-28">
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-zinc-100 rounded-xl">
                            <Plus className="w-4 h-4 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight">Registrar Horas</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Estudiante</label>
                            <div className="relative">
                                <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="select-custom w-full py-3.5 px-5 pr-10">
                                    {myStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Fecha</label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm" />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">Cantidad de Horas</label>
                            <div className="relative">
                                <Clock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input type="number" value={hours} onChange={e => setHours(e.target.value)} step="0.5" min="0" className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-3.5 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm" placeholder="Ej. 4.5" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Descripción</label>
                                <span className="text-[10px] font-bold text-zinc-300">{description.length} / {LIMITS.DESCRIPTION}</span>
                            </div>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={LIMITS.DESCRIPTION} className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-4 px-5 focus:outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all text-sm placeholder:text-zinc-400" placeholder="¿Qué tareas realizó el estudiante?"></textarea>
                        </div>
                        <button type="submit" className="w-full bg-zinc-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95">
                            Registrar y Aprobar
                        </button>
                    </form>
                </div>
            </div>
        </div>

        {/* Rejection Modal */}
        <AnimatePresence>
            {rejectingLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl"
                    >
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="p-2 bg-rose-50 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-rose-600" />
                            </div>
                            <h3 className="text-xl font-bold">Rechazar Registro</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <p className="text-sm text-zinc-500">
                                Por favor, indica la razón por la cual estás rechazando las <strong>{rejectingLog.hours}h</strong> del estudiante <strong>{(allUsers || []).find(u => u.id === rejectingLog.studentId)?.name}</strong>.
                            </p>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Razón del Rechazo</label>
                                    <span className="text-[10px] font-bold text-zinc-300">{rejectionReason.length} / {LIMITS.REJECTION_REASON}</span>
                                </div>
                                <div className="relative">
                                    <MessageSquare className="w-4 h-4 absolute left-4 top-4 text-zinc-400" />
                                    <textarea 
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        maxLength={LIMITS.REJECTION_REASON}
                                        className="w-full bg-zinc-50 border-zinc-200 rounded-2xl py-4 pl-12 pr-5 focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all text-sm"
                                        placeholder="Ej. Descripción insuficiente, horas incorrectas..."
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button 
                                onClick={() => {
                                    setRejectingLog(null);
                                    setRejectionReason('');
                                }}
                                className="py-4 rounded-2xl text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleConfirmReject}
                                className="py-4 bg-rose-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                            >
                                Confirmar Rechazo
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </main>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default DeptHeadPortal;
