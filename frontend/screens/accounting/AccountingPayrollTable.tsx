/**
 * screens/accounting/AccountingPayrollTable.tsx
 *
 * "Libros por Departamento" — department-grouped payroll books.
 * Each department card shows individual student rows with full financial
 * breakdown and a "registered" toggle so the accountant can mark which
 * students have already been entered into the external payroll software.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  CheckCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import type { DeptBook } from '../../services/reportsService';
import { formatCurrency, cn } from '../../lib/utils';

interface AccountingPayrollTableProps {
  approvedBooks:      DeptBook[];
  processedBooks:     DeptBook[];
  registeredIds:      Set<string>;
  onToggleRegistered: (studentId: string) => void;
  onProcessPayments:  () => void;
}

// ─── Single department book ────────────────────────────────────────────────────
const DeptBookCard: React.FC<{
  book:               DeptBook;
  registeredIds:      Set<string>;
  onToggleRegistered: (id: string) => void;
  dimmed?:            boolean; // processed books look dimmer
}> = ({ book, registeredIds, onToggleRegistered, dimmed }) => {
  const [collapsed, setCollapsed] = useState(false);
  const registeredCount = book.students.filter(s => registeredIds.has(s.studentId)).length;
  const allRegistered   = registeredCount === book.students.length && book.students.length > 0;

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
        <div className="flex items-center gap-6">
          <div className="hidden sm:grid grid-cols-3 gap-x-8 text-right">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Horas</p>
              <p className="text-sm font-black font-mono">{book.totalHours.toFixed(1)} h</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Bruto</p>
              <p className="text-sm font-black font-mono">{formatCurrency(book.totalBruto)}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-faint">Neto</p>
              <p className="text-sm font-black font-mono">{formatCurrency(book.totalNeto)}</p>
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
            <div className="border-t border-border-faint overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface text-[9px] uppercase tracking-widest text-faint font-bold">
                    <th className="px-6 py-3 w-8">
                      {/* registered col header */}
                      <Check className="w-3 h-3" />
                    </th>
                    <th className="px-3 py-3">Estudiante</th>
                    <th className="px-3 py-3">Carnet</th>
                    <th className="px-3 py-3 text-right">Horas</th>
                    <th className="px-3 py-3 text-right">Bruto</th>
                    <th className="px-3 py-3 text-right">Diezmo</th>
                    <th className="px-3 py-3 text-right">Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-faint">
                  {book.students.map(student => {
                    const isRegistered = registeredIds.has(student.studentId);
                    return (
                      <tr
                        key={student.studentId}
                        className={cn(
                          'transition-colors group',
                          isRegistered ? 'bg-surface/50' : 'hover:bg-surface/40',
                        )}
                      >
                        {/* Registered toggle */}
                        <td className="px-6 py-3">
                          <button
                            title={isRegistered ? 'Marcar como no registrado' : 'Marcar como registrado'}
                            onClick={() => onToggleRegistered(student.studentId)}
                            className={cn(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                              isRegistered
                                ? 'bg-foreground border-foreground text-background'
                                : 'border-border bg-card hover:border-foreground/40',
                            )}
                          >
                            {isRegistered && <Check className="w-3 h-3" />}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            'text-sm font-medium',
                            isRegistered ? 'text-muted line-through' : 'text-foreground',
                          )}>
                            {student.studentName}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs font-mono text-faint">
                            {student.carnet ?? '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-bold font-mono">
                            {student.totalHours.toFixed(2)} h
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-mono text-muted">
                            {formatCurrency(student.totalBruto)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-xs font-mono text-faint">
                            −{formatCurrency(student.totalTithe)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-black font-mono">
                            {formatCurrency(student.totalNeto)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Dept totals footer */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-surface font-black text-xs">
                    <td className="px-6 py-3" colSpan={3}>
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
                      −{formatCurrency(book.totalTithe)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono">
                      {formatCurrency(book.totalNeto)}
                    </td>
                  </tr>
                </tfoot>
              </table>
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
  onToggleRegistered,
  onProcessPayments,
}) => {
  const [tab, setTab] = useState<'approved' | 'processed'>('approved');
  const books    = tab === 'approved' ? approvedBooks : processedBooks;
  const hasBooks = books.length > 0;

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
              dimmed={tab === 'processed'}
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
        {approvedBooks.length > 0 && (
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
              <span>Procesar Pagos del Período</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountingPayrollTable;

