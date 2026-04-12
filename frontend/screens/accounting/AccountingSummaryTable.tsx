import React from 'react';
import { motion } from 'motion/react';
import type { DeptBook } from '../../services/reportsService';
import { formatCurrency } from '../../lib/utils';

interface AccountingSummaryTableProps {
  books: DeptBook[];
}

const AccountingSummaryTable: React.FC<AccountingSummaryTableProps> = ({ books }) => {
  const totals = books.reduce(
    (acc, book) => {
      acc.hours += book.totalHours;
      acc.bruto += book.totalBruto;
      acc.tithe += book.totalTithe;
      acc.neto += book.totalNeto;
      acc.receivable += book.totalReceivable;
      acc.payable += book.totalPayable;
      return acc;
    },
    { hours: 0, bruto: 0, tithe: 0, neto: 0, receivable: 0, payable: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-8 rounded-[2.5rem] border border-border-faint"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black tracking-tight text-foreground">
            Resumen General por Departamento
          </h3>
          <p className="text-xs text-faint mt-0.5">
            Reporte concentrado de becas, diezmos y retenciones
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface text-[10px] uppercase tracking-widest text-faint font-bold border-b border-border">
              <th className="px-4 py-4 rounded-tl-xl text-left">Departamento</th>
              <th className="px-4 py-4 text-center">Horas</th>
              <th className="px-4 py-4 text-right">Total Becas</th>
              <th className="px-4 py-4 text-right">Diezmos</th>
              <th className="px-4 py-4 text-right">Monto Neto</th>
              <th className="px-4 py-4 text-right">Por Cobrar</th>
              <th className="px-4 py-4 text-right rounded-tr-xl">Por Pagar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint text-sm">
            {books.map((book) => (
              <tr key={book.departmentId} className="hover:bg-surface/40 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">
                  {book.departmentName}
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  {book.totalHours.toFixed(1)} h
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">
                  {formatCurrency(book.totalBruto)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-faint">
                  {formatCurrency(-book.totalTithe)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  {formatCurrency(book.totalNeto)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">
                  {formatCurrency(book.totalReceivable)}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-primary">
                  {formatCurrency(book.totalPayable)}
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-faint text-sm italic">
                  No hay datos para mostrar en este período.
                </td>
              </tr>
            )}
          </tbody>
          {books.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-primary/30 bg-primary/5 font-black text-xs">
                <td className="px-4 py-4 rounded-bl-xl text-left">
                  <span className="text-xs font-black tracking-tight text-foreground">Grandes Totales</span>
                </td>
                <td className="px-4 py-4 text-center font-mono font-black">{totals.hours.toFixed(1)} h</td>
                <td className="px-4 py-4 text-right font-mono font-black">{formatCurrency(totals.bruto)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-faint">{formatCurrency(-totals.tithe)}</td>
                <td className="px-4 py-4 text-right font-mono font-black">{formatCurrency(totals.neto)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-muted">{formatCurrency(totals.receivable)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-primary rounded-br-xl">{formatCurrency(totals.payable)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </motion.div>
  );
};

export default AccountingSummaryTable;
