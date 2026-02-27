import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { toast, Toaster } from 'sonner';
import Header from '../../components/Header';
import { User, WorkLog, LIMITS } from '../../types';
import { exportToCSV, exportToPDF } from '../../lib/utils';
import { getBillingCycle, isDateInCycle, getTrimester } from '../../lib/business';
import { TITHE_PERCENTAGE } from '../../constants';
import { useConfirm } from '../../hooks/useConfirm';
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
  // Timer state
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const { confirm, dialogProps } = useConfirm();

  // History state
  const [historyView, setHistoryView] = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [selectedTrimester, setSelectedTrimester] = useState(getTrimester().num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Restore session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem(`session_${user.id}`);
    if (savedSession) {
      const { start, desc } = JSON.parse(savedSession);
      setStartTime(start);
      setDescription(desc);
      setIsTracking(true);
    }
  }, [user.id]);

  // Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const handleStart = () => {
    const now = Date.now();
    setStartTime(now);
    setIsTracking(true);
    localStorage.setItem(
      `session_${user.id}`,
      JSON.stringify({ start: now, desc: description }),
    );
    toast.success('Sesión iniciada correctamente', { position: 'top-center' });
  };

  const handleCancel = async () => {
    const ok = await confirm(
      '¿Cancelar la sesión actual? Se perderá el tiempo transcurrido.',
      { variant: 'danger', title: 'Cancelar sesión' },
    );
    if (!ok) return;
    setIsTracking(false);
    setStartTime(null);
    setElapsedTime(0);
    setDescription('');
    localStorage.removeItem(`session_${user.id}`);
    toast.info('Sesión cancelada', { position: 'top-center' });
  };

  const handleFinish = () => {
    if (!description.trim()) {
      toast.error('Debes ingresar una descripción de las tareas realizadas.', {
        position: 'top-center',
      });
      return;
    }
    if (description.length > LIMITS.DESCRIPTION) {
      toast.error(`La descripción no puede exceder los ${LIMITS.DESCRIPTION} caracteres.`, {
        position: 'top-center',
      });
      return;
    }
    if (startTime) {
      const durationHours = parseFloat(
        ((Date.now() - startTime) / (1000 * 60 * 60)).toFixed(2),
      );
      if (durationHours < 0.01) {
        toast.error('La sesión es demasiado corta para ser registrada.', {
          position: 'top-center',
        });
        return;
      }
      addWorkLog({
        studentId: user.id,
        departmentId: user.departmentId || 'N/A',
        date: new Date().toISOString().split('T')[0],
        hours: durationHours,
        description,
      });
      setIsTracking(false);
      setStartTime(null);
      setDescription('');
      localStorage.removeItem(`session_${user.id}`);
      toast.success('Sesión finalizada y registrada para revisión', { position: 'top-center' });
    }
  };

  const stats = useMemo(() => {
    const currentCycleLogs = (myLogs || []).filter(log =>
      isDateInCycle(log.date, selectedCycle),
    );
    const totalHours = currentCycleLogs.reduce((acc, log) => acc + log.hours, 0);
    const grossAmount = totalHours * currentRate;
    const tithe = grossAmount * TITHE_PERCENTAGE;
    const netAmount = grossAmount - tithe;
    return { totalHours, grossAmount, tithe, netAmount };
  }, [myLogs, selectedCycle, currentRate]);

  const filteredLogs = useMemo(() => {
    if (historyView === 'cycle') {
      return (myLogs || []).filter(log => isDateInCycle(log.date, selectedCycle));
    }
    return (myLogs || []).filter(log => {
      const logDate = new Date(log.date + 'T00:00:00');
      let logTrimester = Math.floor(logDate.getMonth() / 4) + 1;
      let logYear = logDate.getFullYear();
      if (logDate.getMonth() === 10 && logDate.getDate() > 25) {
        logTrimester = 1;
        logYear++;
      }
      if (logDate.getMonth() === 11) {
        logTrimester = 1;
        logYear++;
      }
      return logTrimester === selectedTrimester && logYear === selectedYear;
    });
  }, [myLogs, historyView, selectedCycle, selectedTrimester, selectedYear]);

  const handleExport = (type: 'csv' | 'pdf') => {
    const headers = ['Fecha', 'Horas', 'Descripción', 'Estado'];
    const rows = (myLogs || []).map(log => [log.date, log.hours, log.description, log.status]);
    const safeName = (user.name || 'estudiante').replace(/\s+/g, '_');
    if (type === 'csv') {
      exportToCSV(`mis_horas_${safeName}.csv`, headers, rows);
    } else {
      exportToPDF(
        `mis_horas_${safeName}.pdf`,
        `Reporte de Horas - ${user.name}`,
        headers,
        rows,
      );
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] selection:bg-zinc-900 selection:text-white">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
      </main>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default StudentPortal;
