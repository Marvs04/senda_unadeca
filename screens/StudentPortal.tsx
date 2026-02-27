import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Square, 
  Clock, 
  Calendar, 
  CheckCircle, 
  Download,
  AlertCircle,
  History,
  TrendingUp,
  CreditCard,
  FileText,
  Zap,
  Coins,
  Wallet,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Header from '../components/Header';
import DashboardCard from '../components/DashboardCard';
import WorkLogTable from '../components/WorkLogTable';
import { User, WorkLog, WorkLogStatus, LIMITS } from '../types';
import { cn, exportToCSV, exportToPDF, formatCurrency } from '../lib/utils';
import { getBillingCycle, isDateInCycle, getTrimester } from '../lib/business';
import { TITHE_PERCENTAGE } from '../constants';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

interface StudentPortalProps {
  user: User;
  onLogout: () => void;
  myLogs: WorkLog[];
  addWorkLog: (newLogData: Omit<WorkLog, 'id' | 'status'>) => void;
  currentRate: number;
  billingCycle: string;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ user, onLogout, myLogs, addWorkLog, currentRate, billingCycle }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');
  const { confirm, dialogProps } = useConfirm();

  useEffect(() => {
    const savedSession = localStorage.getItem(`session_${user.id}`);
    if (savedSession) {
      const { start, desc } = JSON.parse(savedSession);
      setStartTime(start);
      setDescription(desc);
      setIsTracking(true);
    }
  }, [user.id]);

  useEffect(() => {
    let interval: any;
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
    localStorage.setItem(`session_${user.id}`, JSON.stringify({ start: now, desc: description }));
    toast.success('Sesión iniciada correctamente', { position: 'top-center' });
  };

  const handleCancel = async () => {
    const ok = await confirm('¿Cancelar la sesión actual? Se perderá el tiempo transcurrido.', { variant: 'danger', title: 'Cancelar sesión' });
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
      toast.error('Debes ingresar una descripción de las tareas realizadas.', { position: 'top-center' });
      return;
    }

    if (description.length > LIMITS.DESCRIPTION) {
        toast.error(`La descripción no puede exceder los ${LIMITS.DESCRIPTION} caracteres.`, { position: 'top-center' });
        return;
    }

    if (startTime) {
      const durationHours = parseFloat(((Date.now() - startTime) / (1000 * 60 * 60)).toFixed(2));
      
      if (durationHours < 0.01) {
          toast.error('La sesión es demasiado corta para ser registrada.', { position: 'top-center' });
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

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const [historyView, setHistoryView] = useState<'cycle' | 'trimester'>('cycle');
  const [selectedCycle, setSelectedCycle] = useState(billingCycle);
  const [selectedTrimester, setSelectedTrimester] = useState(getTrimester().num);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const stats = useMemo(() => {
    const currentCycleLogs = (myLogs || []).filter(log => isDateInCycle(log.date, selectedCycle));
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
    const rows = (myLogs || []).map(log => [
        log.date,
        log.hours,
        log.description,
        log.status
    ]);

    const safeName = (user.name || 'estudiante').replace(/\s+/g, '_');
    if (type === 'csv') {
        exportToCSV(`mis_horas_${safeName}.csv`, headers, rows);
    } else {
        exportToPDF(`mis_horas_${safeName}.pdf`, `Reporte de Horas - ${user.name}`, headers, rows);
    }
    toast.success(`Reporte ${type.toUpperCase()} generado`, { position: 'top-center' });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] selection:bg-zinc-900 selection:text-white">
      <Toaster position="top-center" richColors />
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Section */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 relative z-0"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 rounded-[3.5rem] shadow-2xl shadow-zinc-900/20" />
            <div className="relative z-10 px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center space-x-8">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-3xl bg-zinc-800 border border-white/10 flex items-center justify-center text-4xl font-black text-white shadow-2xl">
                            {user.name?.charAt(0)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-zinc-900 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-white fill-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white tracking-tight mb-2">{user.name}</h2>
                        <div className="flex flex-wrap gap-3">
                            <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                {user.carnet || 'Sin Carnet'}
                            </span>
                            <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                Estudiante Activo
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-12 px-10 py-6 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-md">
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Horas Totales</p>
                        <p className="text-2xl font-black text-white">{(myLogs || []).reduce((acc, l) => acc + l.hours, 0).toFixed(1)}h</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Tarifa Actual</p>
                        <p className="text-2xl font-black text-white">{formatCurrency(currentRate)}</p>
                    </div>
                </div>
            </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: History */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden">
              <div className="px-10 py-8 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-zinc-900 text-white rounded-2xl shadow-lg shadow-zinc-900/20">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Mis Registros</h3>
                    <p className="text-xs text-zinc-400 font-medium">Historial detallado de tus horas</p>
                  </div>
                </div>
                
                <div className="flex items-center bg-zinc-100 p-1.5 rounded-2xl">
                    <button 
                        onClick={() => setHistoryView('cycle')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            historyView === 'cycle' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        Mes
                    </button>
                    <button 
                        onClick={() => setHistoryView('trimester')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            historyView === 'trimester' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                        )}
                    >
                        Cuatri
                    </button>
                </div>
              </div>

              <div className="p-4">
                <div className="mb-4 flex items-center justify-between px-4">
                    <div className="flex items-center space-x-2">
                        {historyView === 'cycle' ? (
                            <div className="relative">
                                <select 
                                    value={selectedCycle}
                                    onChange={(e) => setSelectedCycle(e.target.value)}
                                    className="select-custom pr-10"
                                >
                                    {Array.from({length: 6}, (_, i) => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() - i);
                                        const cycle = getBillingCycle(d);
                                        return <option key={cycle.value} value={cycle.value}>{cycle.label}</option>;
                                    })}
                                </select>
                                <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <select 
                                        value={selectedTrimester}
                                        onChange={(e) => setSelectedTrimester(Number(e.target.value))}
                                        className="select-custom pr-10"
                                    >
                                        {[1, 2, 3].filter(t => {
                                            const currentT = getTrimester();
                                            if (selectedYear < currentT.year) return true;
                                            return t <= currentT.num;
                                        }).map(t => (
                                            <option key={t} value={t}>{t === 1 ? '1er' : t === 2 ? '2do' : '3er'} Cuatrimestre</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <select 
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="select-custom pr-10"
                                    >
                                        {[2024, 2025].filter(y => y <= getTrimester().year).map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleExport('pdf')} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                            <Download className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <WorkLogTable logs={filteredLogs} users={[user]} departments={[]} title="" />
              </div>
            </div>
          </div>

          {/* Right Column: Timer & Financials */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-zinc-950 p-10 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl shadow-zinc-950/40"
            >
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-[120px] -mr-40 -mt-40" />
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 blur-[120px] -ml-40 -mb-40" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isTracking ? "bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.6)]" : "bg-zinc-800"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
                      {isTracking ? 'En Progreso' : 'Registro de Tiempo'}
                    </span>
                  </div>
                  {isTracking && (
                    <button 
                        onClick={handleCancel}
                        className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400 transition-colors"
                    >
                        Cancelar
                    </button>
                  )}
                </div>

                <div className="text-center mb-12">
                  <h3 className="text-8xl font-black tracking-tighter font-mono tabular-nums leading-none">
                    {formatTime(elapsedTime)}
                  </h3>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mt-6">Cronómetro de Precisión</p>
                </div>

                <div className="space-y-6">
                  <AnimatePresence>
                    {isTracking && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="relative"
                        >
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="¿Qué estás trabajando ahora?"
                                maxLength={LIMITS.DESCRIPTION}
                                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[120px] resize-none placeholder:text-zinc-700"
                            />
                            <div className="absolute bottom-6 right-8 text-[10px] font-black text-zinc-700">
                                {description.length} / {LIMITS.DESCRIPTION}
                            </div>
                        </motion.div>
                    )}
                  </AnimatePresence>

                  {!isTracking ? (
                    <button 
                      onClick={handleStart}
                      className="w-full bg-white text-zinc-950 font-black py-8 rounded-[2.5rem] flex items-center justify-center space-x-4 hover:bg-zinc-100 transition-all shadow-xl active:scale-[0.97]"
                    >
                      <Play className="w-5 h-5 fill-zinc-950" />
                      <span className="text-xl tracking-tight">Iniciar Sesión</span>
                    </button>
                  ) : (
                    <button 
                      onClick={handleFinish}
                      className="w-full bg-emerald-500 text-white font-black py-8 rounded-[2.5rem] flex items-center justify-center space-x-4 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.97]"
                    >
                      <Square className="w-5 h-5 fill-white" />
                      <span className="text-xl tracking-tight">Finalizar Registro</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Financial Cards below Timer */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
                    <div className="p-3 bg-emerald-50 w-fit rounded-2xl mb-6">
                        <Wallet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Total Neto</p>
                    <p className="text-3xl font-black font-display text-zinc-900 leading-none">{formatCurrency(stats.netAmount)}</p>
                    <div className="mt-4 flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                        <TrendingUp className="w-3 h-3" />
                        <span>{stats.totalHours.toFixed(1)}h acumuladas</span>
                    </div>
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/40 relative overflow-hidden group"
                >
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
                    <div className="p-3 bg-amber-50 w-fit rounded-2xl mb-6">
                        <Coins className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Diezmo (10%)</p>
                    <p className="text-3xl font-black font-display text-amber-600 leading-none">{formatCurrency(stats.tithe)}</p>
                    <p className="mt-4 text-[10px] font-bold text-zinc-400 italic">"Mis manos dan, Dios multiplica"</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="p-8 rounded-[3rem] bg-zinc-900 text-white relative overflow-hidden group min-h-[160px] flex items-center">
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
                    <div className="relative z-10 flex items-start space-x-6">
                        <div className="p-4 bg-white/10 rounded-2xl">
                            <Zap className="w-6 h-6 text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-widest mb-2">Próximo Corte</h4>
                            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                                Tu próximo pago se procesará el <span className="text-white font-bold">25 de {getBillingCycle().label.split(' ')[0]}</span>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </main>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
};

export default StudentPortal;
