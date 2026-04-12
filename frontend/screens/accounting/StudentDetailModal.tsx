import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Download, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api';
import { formatCurrency, formatIsoDate, formatCostaRicaLongDate } from '../../lib/utils';
import { renderPDF } from '../../lib/pdf';
import { Button } from '../../components/ui';

interface StudentDetailModalProps {
  studentId: string;
  periodKey: string;
  queryParams: Record<string, string>; // mode, cycle, trimester, year, rate
  onClose: () => void;
}

interface StudentReportData {
  student: {
    id: string;
    name: string;
    carnet?: string;
  };
  periodKey: string;
  logs: {
    id: string;
    date: string;
    description: string;
    departmentName: string;
    status: string;
    hours: number;
    bruto: number;
    tithe: number;
    neto: number;
  }[];
  summary: {
    totalHours: number;
    totalBruto: number;
    totalTithe: number;
    totalNeto: number;
    manualReceivable: number;
    totalPayable: number;
  };
}

function extractApiErrorMessage(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message?: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: unknown }).response === 'object'
  ) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;
    const nestedMessage = response?.data?.message;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return 'Error al cargar reporte';
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ studentId, periodKey, queryParams, onClose }) => {
  const [data, setData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data: res } = await apiClient.get<StudentReportData>(`/reports/student/${studentId}`, {
          params: queryParams
        });
        if (mounted) setData(res);
      } catch (err: unknown) {
        if (mounted) setError(extractApiErrorMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchReport();
    return () => { mounted = false; };
  }, [studentId, queryParams]);

  const handleExportPDF = () => {
    if (!data) return;
    const now = formatCostaRicaLongDate();
    const periodName = queryParams.mode === 'cycle' 
      ? `Ciclo ${queryParams.cycle}`
      : `Q${queryParams.trimester} ${queryParams.year}`;

    renderPDF({
      filename: `reporte_${data.student.carnet || 'beca'}_${periodKey}.pdf`,
      reportTitle: `REPORTE DE HORAS BECA \u2014 ${data.student.name}`,
      subtitle: `C\u00e9dula/Carnet: ${data.student.carnet || 'N/A'}`,
      meta: [
        { label: 'Per\u00edodo', value: periodName },
        { label: 'Fecha de Emisi\u00f3n', value: now },
      ],
      headers: ['Fecha', 'Departamento', 'Descripci\u00f3n', 'Horas', 'Bruto', 'Diezmo', 'Neto'],
      rows: [
        ...data.logs.map(l => [
          formatIsoDate(l.date),
          l.departmentName,
          l.description || '-',
          l.hours.toFixed(1),
          formatCurrency(l.bruto),
          formatCurrency(-l.tithe),
          formatCurrency(l.neto)
        ]),
        [
          'TOTALES',
          '-',
          '-',
          data.summary.totalHours.toFixed(1),
          formatCurrency(data.summary.totalBruto),
          formatCurrency(-data.summary.totalTithe),
          formatCurrency(data.summary.totalNeto),
        ],
        [
          'Cuentas por Cobrar',
          '-',
          '-',
          '-',
          '-',
          '-',
          formatCurrency(data.summary.manualReceivable),
        ],
        [
          'TOTAL A PAGAR',
          '-',
          '-',
          '-',
          '-',
          '-',
          formatCurrency(data.summary.totalPayable),
        ]
      ]
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-card rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        >
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Cargando detalle...</p>
            </div>
          ) : error || !data ? (
            <div className="h-64 flex flex-col items-center justify-center text-danger">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <p>{error || 'No se encontr\u00f3 datos.'}</p>
              <Button onClick={onClose} variant="ghost" className="mt-4">Volver</Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-faint shrink-0 relative bg-surface/50">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <h2 className="text-2xl font-black text-foreground">{data.student.name}</h2>
                  <p className="text-sm font-mono text-faint mt-1">
                    Carnet: <span className="text-muted">{data.student.carnet || 'N/A'}</span>
                    {' • '}
                    Período: <span className="text-muted">{periodKey}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 relative">
                  <Button variant="outline" onClick={handleExportPDF} icon={<Download className="w-4 h-4" />}>
                    PDF Individual
                  </Button>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 text-faint hover:text-foreground hover:bg-surface rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 bg-background">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                  {/* Horas */}
                  <div className="bg-surface border border-border-faint p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] text-faint uppercase font-bold tracking-wider mb-1">Horas</span>
                    <span className="text-xl font-mono text-foreground font-black">{data.summary.totalHours.toFixed(1)}</span>
                  </div>
                  {/* Bruto */}
                  <div className="bg-surface border border-border-faint p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] text-faint uppercase font-bold tracking-wider mb-1">Bruto</span>
                    <span className="text-lg font-mono text-muted font-black">{formatCurrency(data.summary.totalBruto)}</span>
                  </div>
                  {/* Diezmo */}
                  <div className="bg-surface border border-border-faint p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] text-faint uppercase font-bold tracking-wider mb-1">Diezmo</span>
                    <span className="text-lg font-mono text-faint font-black">{formatCurrency(-data.summary.totalTithe)}</span>
                  </div>
                  {/* Neto */}
                  <div className="bg-surface border border-border-faint p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] text-faint uppercase font-bold tracking-wider mb-1">Neto</span>
                    <span className="text-lg font-mono text-foreground font-black">{formatCurrency(data.summary.totalNeto)}</span>
                  </div>
                  {/* Por Cobrar */}
                  <div className="bg-surface border border-border-faint p-4 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-[10px] text-faint uppercase font-bold tracking-wider mb-1">Por Cobrar</span>
                    <span className="text-lg font-mono text-danger font-black">{formatCurrency(data.summary.manualReceivable)}</span>
                  </div>
                  {/* A Pagar */}
                  <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1 relative">A Pagar</span>
                    <span className="text-xl font-mono text-primary font-black relative">{formatCurrency(data.summary.totalPayable)}</span>
                  </div>
                </div>

                <div className="border border-border-faint rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left bg-card text-sm">
                    <thead>
                      <tr className="bg-surface border-b border-border-faint text-xs uppercase tracking-widest text-faint font-bold text-center">
                        <th className="px-3 py-3 text-left">Fecha</th>
                        <th className="px-3 py-3 text-left">Depto</th>
                        <th className="px-3 py-3 text-left hidden md:table-cell">Descripción</th>
                        <th className="px-3 py-3">Horas</th>
                        <th className="px-3 py-3">Bruto</th>
                        <th className="px-3 py-3">Diezmo</th>
                        <th className="px-3 py-3 text-right">Neto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-faint font-mono text-center">
                      {data.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-surface/30 transition-colors group">
                          <td className="px-3 py-2 text-left whitespace-nowrap text-muted">{formatIsoDate(log.date)}</td>
                          <td className="px-3 py-2 text-left font-sans text-xs">
                            <span className="px-2 py-0.5 bg-surface text-foreground rounded-full border border-border-faint">
                              {log.departmentName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-left text-faint text-xs truncate max-w-[200px] hidden md:table-cell" title={log.description}>
                            {log.description || '-'}
                          </td>
                          <td className="px-3 py-2">{log.hours.toFixed(1)}</td>
                          <td className="px-3 py-2 text-muted">{formatCurrency(log.bruto)}</td>
                          <td className="px-3 py-2 text-faint text-xs">{formatCurrency(-log.tithe)}</td>
                          <td className="px-3 py-2 text-right font-bold text-foreground">{formatCurrency(log.neto)}</td>
                        </tr>
                      ))}
                      {data.logs.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-faint italic font-sans">
                            No hay registros de horas en este período.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StudentDetailModal;
