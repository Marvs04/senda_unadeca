/**
 * screens/accounting/AccountingPayrollTable.tsx
 *
 * "Libros por Departamento" — department-grouped payroll books.
 * Each department card shows individual student rows with full financial
 * breakdown and a "registered" toggle so the accountant can mark which
 * students have already been entered into the external payroll software.
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  Eye,
  EyeOff,
  Upload,
  FileDown,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import type { DeptBook } from '../../services/reportsService';
import { formatCurrency, cn } from '../../lib/utils';

/** Display hours; values under 6 min show as minutes */
function formatHours(h: number): string {
  if (h > 0 && h < 0.1) {
    return `${Math.round(h * 60)} min`;
  }
  return `${h.toFixed(2)} h`;
}

interface AccountingPayrollTableProps {
  approvedBooks:               DeptBook[];
  processedBooks:              DeptBook[];
  registeredIds:               Set<string>;
  periodKey:                   string;
  onToggleRegistered:          (studentId: string) => void;
  onProcessPayments:           () => void;
  onUpdateReceivable:          (studentId: string, amount: number) => void;
  onBatchImportReceivables:    (rows: { studentId: string; amount: number }[]) => Promise<void>;
  onDownloadDeptPDF?:          (book: DeptBook) => void;
  onStudentClick?:             (studentId: string) => void;
  selectedPaymentIds:          Set<string>;
  onTogglePaymentSelection:    (workLogId: string) => void;
}

// ─── Component: Editable Input ────────────────────────────────────────────────
const ReceivableInput: React.FC<{ initialValue: number; disabled: boolean; onSave: (val: number) => void }> = ({ initialValue, disabled, onSave }) => {
  const [val, setVal] = useState(initialValue?.toString() || '0');
  
  React.useEffect(() => setVal(initialValue?.toString() || '0'), [initialValue]);

  const handleBlur = () => {
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0 && num !== initialValue) {
      onSave(num);
    }
  };

  return (
    <div className="relative flex items-center justify-end">
      <span className="text-[10px] text-faint absolute left-2 pointer-events-none">₡</span>
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        className={cn(
          "w-[85px] pl-6 pr-2 py-1.5 text-right font-mono text-xs rounded-lg transition-all",
          disabled
            ? "bg-transparent border-transparent text-muted"
            : "bg-background border border-border hover:border-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        )}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={handleBlur}
      />
    </div>
  );
};

// ─── Single department book ────────────────────────────────────────────────────
const DeptBookCard: React.FC<{
  book:               DeptBook;
  registeredIds:      Set<string>;
  onToggleRegistered: (id: string) => void;
  onUpdateReceivable: (id: string, val: number) => void;
  onStudentClick?:    (id: string) => void;
  onDownloadDeptPDF?: (book: DeptBook) => void;
  dimmed?:            boolean; // processed books look dimmer
  showCarnet:         boolean;
  selectedPaymentIds: Set<string>;
  onTogglePaymentSelection: (workLogId: string) => void;
}> = ({ 
  book, 
  registeredIds, 
  onToggleRegistered, 
  onUpdateReceivable, 
  onStudentClick, 
  onDownloadDeptPDF, 
  dimmed, 
  showCarnet,
  selectedPaymentIds,
  onTogglePaymentSelection,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const registeredCount = book.students.filter(s => registeredIds.has(s.studentId)).length;
  const allRegistered   = registeredCount === book.students.length && book.students.length > 0;

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    book.students.forEach(s => {
      if (!registeredIds.has(s.studentId)) onToggleRegistered(s.studentId);
    });
  };

  return (
    <motion.div
      layout
      className={cn(
        'rounded-[2rem] border overflow-hidden transition-opacity',
        dimmed ? 'border-border-faint opacity-70' : 'border-border-faint',
      )}
    >
      {/* Dept header */}
      <div
        className={cn(
          'flex items-start justify-between px-6 py-5 cursor-pointer select-none',
          allRegistered ? 'bg-surface' : 'bg-card',
        )}
        onClick={() => setCollapsed(p => !p)}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            'p-2.5 rounded-xl border transition-colors',
            allRegistered
              ? 'bg-foreground border-foreground text-background'
              : 'bg-surface border-border',
          )}>
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black tracking-tight text-foreground">
                {book.departmentName}
              </h4>
              {allRegistered && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-foreground text-background rounded-full">
                  Completo
                </span>
              )}
              {!allRegistered && registeredCount > 0 && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded-full">
                  Pendiente
                </span>
              )}
            </div>
            <p className="text-[10px] text-faint mt-0.5">
              {book.students.length} estudiante{book.students.length !== 1 ? 's' : ''} &nbsp;·&nbsp;{' '}
              <span className={registeredCount > 0 ? 'text-foreground font-bold' : ''}>
                {registeredCount}/{book.students.length} registrado{book.students.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
        </div>

        {/* Dept totals + collapse toggle */}
        <div className="flex items-center gap-4">            {/* Select all button */}
            {!dimmed && !allRegistered && (
              <button
                onClick={handleSelectAll}
                className="text-[9px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors border border-border-faint rounded-lg px-2.5 py-1"
              >
                Seleccionar todos
              </button>
            )}
            {/* Download dept PDF */}
            {onDownloadDeptPDF && (
              <button
                onClick={(e) => { e.stopPropagation(); onDownloadDeptPDF(book); }}
                title="Descargar PDF del departamento"
                className="p-1.5 rounded-lg border border-border-faint hover:bg-surface transition-colors text-muted hover:text-foreground"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}
          <div className="hidden sm:grid grid-cols-5 gap-x-6 text-right">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Horas</p>
              <p className="text-sm font-black font-mono">{book.totalHours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Bruto</p>
              <p className="text-sm font-black font-mono">{formatCurrency(book.totalBruto)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Diezmo</p>
              <p className="text-sm font-black font-mono text-faint">{formatCurrency(-book.totalTithe)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Neto</p>
              <p className="text-sm font-black font-mono">{formatCurrency(book.totalNeto)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Por Pagar</p>
              <p className="text-sm font-black font-mono text-primary">{formatCurrency(book.totalPayable)}</p>
            </div>
          </div>
          {collapsed
            ? <ChevronDown className="w-4 h-4 text-faint shrink-0" />
            : <ChevronUp   className="w-4 h-4 text-faint shrink-0" />
          }
        </div>
      </div>

      {/* Student rows */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border-faint">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface text-[9px] uppercase tracking-widest text-faint font-bold">
                      <th className="px-6 py-3 w-8">
                        <Check className="w-3 h-3" />
                      </th>
                      <th className="px-3 py-3">Estudiante</th>
                      {showCarnet && <th className="px-3 py-3">Carnet</th>}
                      <th className="px-3 py-3 text-right">Horas</th>
                      <th className="px-3 py-3 text-right">Bruto</th>
                      <th className="px-3 py-3 text-right">Diezmo</th>
                      <th className="px-3 py-3 text-right">Neto</th>
                      <th className="px-3 py-3 text-right">Por Cobrar</th>
                      <th className="px-3 py-3 text-right">Por Pagar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-faint">
                    {book.students.map(student => {
                      const isRegistered = registeredIds.has(student.studentId);
                      const isSelected = selectedPaymentIds.has(student.studentId);
                      return (
                        <tr
                          key={student.studentId}
                          className={cn(
                            'transition-colors group',
                            isSelected ? 'bg-primary/5' : 'hover:bg-surface/40',
                          )}
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              {/* Selection checkbox - disabled for processed books */}
                              <button
                                disabled={dimmed}
                                title={dimmed ? 'No puedes seleccionar pagos procesados' : (isSelected ? 'Deseleccionar para procesar' : 'Seleccionar para procesar')}
                                onClick={() => !dimmed && onTogglePaymentSelection(student.studentId)}
                                className={cn(
                                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                                  dimmed 
                                    ? 'border-border bg-surface cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-primary border-primary text-background'
                                    : 'border-border bg-card hover:border-foreground/40 cursor-pointer',
                                )}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                              {/* Registered indicator */}
                              {isRegistered && (
                                <div
                                  title="Registrado en nómina"
                                  className="w-3 h-3 rounded-full bg-foreground/40"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 relative">
                            <button
                              onClick={() => onStudentClick?.(student.studentId)}
                              className="group/btn flex flex-col items-start text-left focus:outline-none"
                            >
                              <span className={cn(
                                'text-sm font-medium text-foreground group-hover/btn:text-primary transition-colors underline decoration-transparent group-hover/btn:decoration-primary/30 underline-offset-4',
                                isRegistered && 'line-through'
                              )}>
                                {student.studentName}
                              </span>
                            </button>
                          </td>
                          {showCarnet && (
                            <td className="px-3 py-3">
                              <span className="text-xs font-mono text-faint">
                                {student.carnet ?? '—'}
                              </span>
                            </td>
                          )}
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-bold font-mono">
                              {formatHours(student.totalHours)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-mono text-muted">
                              {formatCurrency(student.totalBruto)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-xs font-mono text-faint">
                              {formatCurrency(-student.totalTithe)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-black font-mono">
                              {formatCurrency(student.totalNeto)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <ReceivableInput
                              initialValue={student.manualReceivable}
                              disabled={dimmed}
                              onSave={(val) => onUpdateReceivable(student.studentId, val)}
                            />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <span className="text-sm font-black font-mono text-primary">
                              {formatCurrency(student.totalPayable)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-surface font-black text-xs">
                      <td className="px-6 py-3" colSpan={showCarnet ? 3 : 2}>
                        <span className="text-[9px] uppercase tracking-widest text-faint">
                          Total {book.departmentName}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {book.totalHours.toFixed(2)} h
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-muted">
                        {formatCurrency(book.totalBruto)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-faint text-xs">
                        {formatCurrency(-book.totalTithe)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono">
                        {formatCurrency(book.totalNeto)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-muted">
                        {formatCurrency(book.totalReceivable)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-primary">
                        {formatCurrency(book.totalPayable)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {book.students.map(student => {
                  const isRegistered = registeredIds.has(student.studentId);
                  return (
                    <div
                      key={student.studentId}
                      className={cn(
                        'border border-border-faint rounded-lg p-3 space-y-2 transition-colors',
                        isRegistered ? 'bg-surface/50' : 'bg-card hover:bg-surface/40',
                      )}
                    >
                      {/* Header: Name + Check */}
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => onStudentClick?.(student.studentId)}
                          className="flex-1 text-left focus:outline-none"
                        >
                          <span className={cn(
                            'text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors underline decoration-transparent group-hover:decoration-primary/30 underline-offset-2',
                            isRegistered && 'line-through'
                          )}>
                            {student.studentName}
                          </span>
                          {showCarnet && (
                            <div className="text-[10px] text-faint font-mono mt-0.5">
                              {student.carnet ?? '—'}
                            </div>
                          )}
                        </button>
                        <button
                          title={isRegistered ? 'Marcar como no registrado' : 'Marcar como registrado'}
                          onClick={() => onToggleRegistered(student.studentId)}
                          className={cn(
                            'shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                            isRegistered
                              ? 'bg-foreground border-foreground text-background'
                              : 'border-border bg-card hover:border-foreground/40',
                          )}
                        >
                          {isRegistered && <Check className="w-3 h-3" />}
                        </button>
                      </div>

                      {/* Grid: financials */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-[10px]">
                          <p className="text-faint font-bold uppercase tracking-widest">Horas</p>
                          <p className="font-bold font-mono text-foreground">{formatHours(student.totalHours)}</p>
                        </div>
                        <div className="text-[10px] text-right">
                          <p className="text-faint font-bold uppercase tracking-widest">Bruto</p>
                          <p className="font-mono text-muted">{formatCurrency(student.totalBruto)}</p>
                        </div>
                        <div className="text-[10px]">
                          <p className="text-faint font-bold uppercase tracking-widest">Diezmo</p>
                          <p className="font-mono text-faint text-xs">{formatCurrency(-student.totalTithe)}</p>
                        </div>
                        <div className="text-[10px] text-right">
                          <p className="text-faint font-bold uppercase tracking-widest">Neto</p>
                          <p className="font-bold font-mono">{formatCurrency(student.totalNeto)}</p>
                        </div>
                      </div>

                      {/* Por Cobrar input */}
                      <div className="border-t border-border-faint pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] text-faint font-bold uppercase tracking-widest">Por Cobrar</p>
                          <ReceivableInput
                            initialValue={student.manualReceivable}
                            disabled={dimmed}
                            onSave={(val) => onUpdateReceivable(student.studentId, val)}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-faint font-bold uppercase tracking-widest">Por Pagar</p>
                          <span className="text-sm font-black font-mono text-primary">
                            {formatCurrency(student.totalPayable)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mobile Footer Totals */}
                <div className="border-t-2 border-border bg-surface rounded-lg p-3 space-y-2 font-black text-xs">
                  <p className="text-[9px] uppercase tracking-widest text-faint">
                    Total {book.departmentName}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <p className="text-faint mb-1">Horas</p>
                      <p className="font-mono">{book.totalHours.toFixed(2)} h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-faint mb-1">Bruto</p>
                      <p className="font-mono text-muted">{formatCurrency(book.totalBruto)}</p>
                    </div>
                    <div>
                      <p className="text-faint text-xs mb-1">Diezmo</p>
                      <p className="font-mono text-faint">{formatCurrency(-book.totalTithe)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-faint mb-1">Neto</p>
                      <p className="font-mono">{formatCurrency(book.totalNeto)}</p>
                    </div>
                    <div>
                      <p className="text-faint text-xs mb-1">Por Cobrar</p>
                      <p className="font-mono text-muted">{formatCurrency(book.totalReceivable)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-faint text-xs mb-1">Por Pagar</p>
                      <p className="font-mono text-primary">{formatCurrency(book.totalPayable)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const AccountingPayrollTable: React.FC<AccountingPayrollTableProps> = ({
  approvedBooks,
  processedBooks,
  registeredIds,
  periodKey,
  onToggleRegistered,
  onProcessPayments,
  onUpdateReceivable,
  onBatchImportReceivables,
  onDownloadDeptPDF,
  onStudentClick,
  selectedPaymentIds,
  onTogglePaymentSelection,
}) => {
  const [tab, setTab] = useState<'approved' | 'processed'>('approved');
  const [showCarnet, setShowCarnet] = useState(false);
  const [importing, setImporting]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const books    = tab === 'approved' ? approvedBooks : processedBooks;
  const hasBooks = books.length > 0;

  // Build carnet → studentId lookup from all approved books
  const carnetToStudentId = React.useMemo(() => {
    const map = new Map<string, string>();
    approvedBooks.forEach(book =>
      book.students.forEach(s => { if (s.carnet) map.set(s.carnet.trim(), s.studentId); })
    );
    return map;
  }, [approvedBooks]);

  // Download CSV template pre-filled with current approved students
  const handleDownloadTemplate = () => {
    const lines = ['carnet,nombre,departamento,cuenta_por_cobrar'];
    approvedBooks.forEach(book =>
      book.students.forEach(s =>
        lines.push(
          `"${s.carnet ?? ''}","${s.studentName}","${book.departmentName}",${(s.manualReceivable ?? 0).toFixed(2)}`
        )
      )
    );
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `template_cxc_${periodKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse uploaded CSV and call the batch handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // reset so same file can be re-selected
    e.target.value = '';

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) {
      toast.error('El archivo no contiene datos.', { position: 'top-center' });
      return;
    }

    // Skip header row; expect: carnet, nombre, departamento, cuenta_por_cobrar
    const rows: { studentId: string; amount: number }[] = [];
    const errors: string[] = [];

    lines.slice(1).forEach((line, idx) => {
      // Handle quoted fields
      const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g)
        ?.map(c => c.replace(/^"|"$/g, '').trim()) ?? line.split(',').map(c => c.trim());

      const carnet = cols[0];
      const amountRaw = cols[3];
      if (!carnet) { errors.push(`Fila ${idx + 2}: carnet vacío.`); return; }

      const studentId = carnetToStudentId.get(carnet);
      if (!studentId) { errors.push(`Fila ${idx + 2}: carnet "${carnet}" no encontrado en período actual.`); return; }

      const amount = parseFloat(amountRaw ?? '0');
      if (isNaN(amount) || amount < 0) { errors.push(`Fila ${idx + 2}: monto inválido "${amountRaw}".`); return; }

      rows.push({ studentId, amount });
    });

    if (errors.length > 0) {
      toast.error(`Errores en el archivo:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n…y ${errors.length - 5} más.` : ''}`, { position: 'top-center', duration: 6000 });
      return;
    }
    if (rows.length === 0) {
      toast.error('No se encontraron filas válidas.', { position: 'top-center' });
      return;
    }

    setImporting(true);
    try {
      await onBatchImportReceivables(rows);
      toast.success(`${rows.length} cuenta${rows.length !== 1 ? 's' : ''} por cobrar importada${rows.length !== 1 ? 's' : ''}.`, { position: 'top-center' });
    } catch {
      toast.error('Error al importar. Intente de nuevo.', { position: 'top-center' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Libros por Departamento
          </h3>
          <p className="text-xs text-faint mt-0.5">
            {tab === 'approved'
              ? 'Horas aprobadas pendientes de pago — márquelas como registradas conforme las ingresa al otro sistema'
              : 'Horas ya procesadas y pagadas'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* CSV import / template buttons */}
          {tab === 'approved' && approvedBooks.length > 0 && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={handleDownloadTemplate}
                title="Descargar template CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border-faint bg-card hover:bg-surface transition-colors text-xs font-bold text-muted"
              >
                <FileDown className="w-3.5 h-3.5" />
                Template
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                title="Importar desde CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-xs font-bold text-primary disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                {importing ? 'Importando…' : 'Importar CxC'}
              </button>
            </>
          )}

          {/* Show/hide carnet toggle */}
          <button
            onClick={() => setShowCarnet(p => !p)}
            title={showCarnet ? 'Ocultar carnet' : 'Mostrar carnet'}
            className="p-2 rounded-xl border border-border-faint bg-card hover:bg-surface transition-colors text-muted"
          >
            {showCarnet ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Tab toggle */}
          <div className="flex items-center bg-surface p-1 rounded-xl border border-border-faint">
            <button
              onClick={() => setTab('approved')}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                tab === 'approved'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Aprobadas ({approvedBooks.reduce((s, b) => s + b.students.length, 0)})
            </button>
            <button
              onClick={() => setTab('processed')}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all',
                tab === 'processed'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground',
              )}
            >
              Procesadas ({processedBooks.reduce((s, b) => s + b.students.length, 0)})
            </button>
          </div>
        </div>
      </div>

      {/* Books */}
      <div className="space-y-4">
        {hasBooks ? (
          books.map(book => (
            <DeptBookCard
              key={book.departmentId}
              book={book}
              registeredIds={registeredIds}
              onToggleRegistered={onToggleRegistered}
              onUpdateReceivable={onUpdateReceivable}
              onStudentClick={onStudentClick}
              onDownloadDeptPDF={onDownloadDeptPDF}
              dimmed={tab === 'processed'}
              showCarnet={showCarnet}
              selectedPaymentIds={selectedPaymentIds}
              onTogglePaymentSelection={onTogglePaymentSelection}
            />
          ))
        ) : (
          <div className="py-16 text-center bg-card rounded-[2rem] border border-border-faint">
            <p className="text-sm text-faint italic">
              {tab === 'approved'
                ? 'No hay horas aprobadas en este período.'
                : 'No hay horas procesadas en este período.'}
            </p>
          </div>
        )}
      </div>

      {/* Process action */}
      <AnimatePresence>
        {approvedBooks.length > 0 && selectedPaymentIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex justify-end"
          >
            <button
              onClick={onProcessPayments}
              className="px-8 py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-80 transition-all flex items-center space-x-3 active:scale-95"
            >
              <CheckCircle className="h-5 w-5 opacity-70" />
              <span>Procesar Pagos ({selectedPaymentIds.size} seleccionado{selectedPaymentIds.size !== 1 ? 's' : ''})</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountingPayrollTable;

