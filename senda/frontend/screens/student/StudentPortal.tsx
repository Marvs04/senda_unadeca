import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { User, WorkLog } from '../../types';
import { exportToCSV, formatCostaRicaLongDate, formatCurrencyPdf } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { getTrimester } from '../../lib/business';
import { useStudentSession } from '../../hooks/useStudentSession';
import { useStudentFilter } from '../../hooks/useStudentFilter';
import { useSessionLocks } from '../../hooks/useSessionLocks';
import ConfirmDialog from '../../components/ConfirmDialog';
import StudentProfile from './StudentProfile';
import StudentTimer from './StudentTimer';
import StudentHistory from './StudentHistory';
import StudentFinancials from './StudentFinancials';

interface StudentPortalProps {
  user: User;
  onLogout: () => void;
  myLogs: WorkLog[];
  addWorkLog: (newLogData: Omit<WorkLog, 'id' | 'status'>) => void;
  currentRate: number;
  billingCycle: string;
}

const StudentPortal: React.FC<StudentPortalProps> = ({
  user,
  onLogout,
  myLogs,
  addWorkLog,
  currentRate,
  billingCycle,
}) => {
  // UI-only state: history view & period selectors
  const [historyView, setHistoryView] = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [selectedTrimester, setSelectedTrimester] = useState(getTrimester().num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Check if session is locked
  const { isSessionLocked, lockReason } = useSessionLocks(user.departmentId ?? '');

  const {
    isTracking,
    elapsedTime,
    description,
    setDescription,
    handleStart,
    handleFinish,
    handleCancel,
    sessionConfirmProps,
    stoppedByHeadReason,
    dismissStoppedByHead,
  } = useStudentSession({ userId: user.id, departmentId: user.departmentId, addWorkLog });

  const { stats, filteredLogs } = useStudentFilter({
    myLogs,
    currentRate,
    historyView,
    selectedCycle,
    selectedTrimester,
    selectedYear,
  });

  const statusLabel = (s: string) =>
    s === 'PENDING' ? 'Pendiente' : s === 'APPROVED' ? 'Aprobado' : s === 'REJECTED' ? 'Rechazado' : s === 'PROCESSED' ? 'Procesado' : s;

  const handleExport = async (type: 'csv' | 'pdf') => {
    const headers = ['Fecha', 'Horas', 'Descripci\u00f3n', 'Estado', 'Raz\u00f3n Rechazo'];
    const rows = (myLogs || []).map(log => [
      log.date,
      log.hours,
      log.description,
      statusLabel(log.status),
      log.rejectionReason || '',
    ]);
    const safeName = (user.name || 'estudiante').replace(/\s+/g, '_');
    if (type === 'csv') {
      exportToCSV(`mis_horas_${safeName}.csv`, headers, rows);
      toast.success('Reporte CSV generado', { position: 'top-center' });
    } else {
      const now = formatCostaRicaLongDate();

      // Calcular totales financieros sobre todos los registros
      const totalHoras = (myLogs || []).reduce((sum, l) => sum + l.hours, 0);
      const bruto      = totalHoras * currentRate;
      const diezmo     = bruto * 0.10;
      const neto       = bruto - diezmo;

      // Horas y monto solo de aprobados/procesados
      const horasAprobadas = (myLogs || [])
        .filter(l => l.status === 'APPROVED' || l.status === 'PROCESSED')
        .reduce((sum, l) => sum + l.hours, 0);
      const montoAprobado = horasAprobadas * currentRate;

      // Agregar columna de monto a la tabla
      const pdfHeaders = [...headers, 'Monto Bruto'];
      const pdfRows = (myLogs || []).map(log => [
        log.date,
        log.hours,
        log.description,
        statusLabel(log.status),
        log.rejectionReason || '',
        ['APPROVED', 'PROCESSED'].includes(log.status)
          ? formatCurrencyPdf(log.hours * currentRate)
          : '-',
      ]);

      await renderPDF({
        filename: `mis_horas_${safeName}.pdf`,
        reportTitle: `REPORTE DE HORAS - ${user.name.toUpperCase()}`,
        subtitle: 'Historial completo de horas de beca estudiantil',
        meta: [
          { label: 'Estudiante',              value: user.name },
          { label: 'Fecha de Emisi\u00f3n',    value: now },
          { label: 'Carnet',                  value: user.carnet || 'N/A' },
          { label: 'Tasa por Hora',           value: formatCurrencyPdf(currentRate) },
          { label: 'Total Horas Registradas', value: `${totalHoras.toFixed(2)} h` },
          { label: 'Horas Aprobadas',         value: `${horasAprobadas.toFixed(2)} h` },
          { label: 'Monto Bruto (aprobado)',  value: formatCurrencyPdf(montoAprobado) },
          { label: 'Diezmo (10%)',            value: formatCurrencyPdf(montoAprobado * 0.10) },
          { label: 'Monto Neto',              value: formatCurrencyPdf(montoAprobado * 0.90) },
        ],
        headers: pdfHeaders,
        rows: pdfRows,
      });
      toast.success('Reporte PDF generado', { position: 'top-center' });
    }
  };

  return (
    <PortalLayout
      user={user}
      onLogout={onLogout}
      bg="bg-background selection:bg-primary selection:text-primary-fg"
      pagePadding="py-12"
    >
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <StudentProfile user={user} myLogs={myLogs} currentRate={currentRate} />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: History */}
          <div className="lg:col-span-7 space-y-8">
            <StudentHistory
              filteredLogs={filteredLogs}
              user={user}
              historyView={historyView}
              setHistoryView={setHistoryView}
              selectedCycle={selectedCycle}
              setSelectedCycle={setSelectedCycle}
              selectedTrimester={selectedTrimester}
              setSelectedTrimester={setSelectedTrimester}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              onExport={handleExport}
            />
          </div>

          {/* Right: Timer + Financials */}
          <div className="lg:col-span-5 space-y-6">
            <StudentTimer
              isTracking={isTracking}
              elapsedTime={elapsedTime}
              description={description}
              setDescription={setDescription}
              onStart={handleStart}
              onFinish={handleFinish}
              onCancel={handleCancel}
              isSessionLocked={isSessionLocked}
              lockReason={lockReason}
            />
            <StudentFinancials stats={stats} />
          </div>
        </div>
      <ConfirmDialog {...sessionConfirmProps} />

      {/* Stopped-by-head modal */}
      <AnimatePresence>
        {stoppedByHeadReason !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-card rounded-3xl shadow-2xl p-8 w-full max-w-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 rounded-xl shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Sesión detenida</h3>
                </div>
                <button onClick={dismissStoppedByHead} className="p-1 text-muted hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted mb-2">
                El jefe de departamento ha detenido tu sesión activa. Las horas registradas quedan como <strong className="text-foreground">denegadas</strong>.
              </p>
              {stoppedByHeadReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mt-3">
                  <p className="text-xs font-semibold text-rose-700 mb-0.5">Razón</p>
                  <p className="text-sm text-rose-800">{stoppedByHeadReason}</p>
                </div>
              )}
              <button
                onClick={dismissStoppedByHead}
                className="mt-5 w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-colors"
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalLayout>
  );
};

export default StudentPortal;
