import React, { useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { PortalLayout } from '../../components/layout';
import { User, WorkLog } from '../../types';
import { exportToCSV, formatCostaRicaLongDate, formatCurrency } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { getTrimester } from '../../lib/business';
import { useStudentSession } from '../../hooks/useStudentSession';
import { useStudentFilter } from '../../hooks/useStudentFilter';
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

  const {
    isTracking,
    elapsedTime,
    description,
    setDescription,
    handleStart,
    handleFinish,
    handleCancel,
    sessionConfirmProps,
  } = useStudentSession({ userId: user.id, departmentId: user.departmentId, addWorkLog });

  const { stats, filteredLogs } = useStudentFilter({
    myLogs,
    currentRate,
    historyView,
    selectedCycle,
    selectedTrimester,
    selectedYear,
  });

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Fecha', 'Horas', 'Descripci\u00f3n', 'Estado'];
    const rows = (myLogs || []).map(log => [log.date, log.hours, log.description, log.status]);
    const safeName = (user.name || 'estudiante').replace(/\s+/g, '_');
    if (type === 'csv') {
      exportToCSV(`mis_horas_${safeName}.csv`, headers, rows);
    } else {
      const now = formatCostaRicaLongDate();
      renderPDF({
        filename: `mis_horas_${safeName}.pdf`,
        reportTitle: `REPORTE DE HORAS — ${user.name.toUpperCase()}`,
        subtitle: 'Historial completo de horas de beca estudiantil',
        meta: [
          { label: 'Estudiante',      value: user.name },
          { label: 'Fecha de Emisi\u00f3n', value: now },
          { label: 'Carnet',          value: user.carnet || 'N/A' },
          { label: 'Tasa por Hora',   value: formatCurrency(currentRate) },
        ],
        headers,
        rows,
      });
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
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
            />
            <StudentFinancials stats={stats} />
          </div>
        </div>
      <ConfirmDialog {...sessionConfirmProps} />
    </PortalLayout>
  );
};

export default StudentPortal;
