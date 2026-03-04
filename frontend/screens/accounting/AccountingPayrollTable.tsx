import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Building, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { User, Department } from '../../types';
import { TITHE_PERCENTAGE } from '../../constants';
import { formatCurrency } from '../../lib/utils';

interface PayrollItem {
  studentId: string;
  departmentId: string;
  totalHours: number;
  totalAmount: number;
  logIds: string[];
}

interface AccountingPayrollTableProps {
  approvedForPayroll: PayrollItem[];
  allUsers: User[];
  allDepartments: Department[];
  onProcessPayments: () => void;
}

const AccountingPayrollTable: React.FC<AccountingPayrollTableProps> = ({
  approvedForPayroll,
  allUsers,
  allDepartments,
  onProcessPayments,
}) => {
  return (
    <div className="bg-card p-8 rounded-[2.5rem] border border-border-faint shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-surface rounded-2xl">
            <TrendingUp className="w-5 h-5 text-muted" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Detalle de Nómina</h3>
            <p className="text-xs text-faint">Listado de estudiantes con horas aprobadas</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-faint">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface text-[10px] uppercase tracking-widest font-bold text-faint">
            <tr>
              <th className="px-6 py-4">Estudiante</th>
              <th className="px-6 py-4">Departamento</th>
              <th className="px-6 py-4">Horas Totales</th>
              <th className="px-6 py-4">Bruto</th>
              <th className="px-6 py-4">Diezmo</th>
              <th className="px-6 py-4">Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-faint">
            {approvedForPayroll.length > 0 ? (
              approvedForPayroll.map(item => {
                const tithe = item.totalAmount * TITHE_PERCENTAGE;
                return (
                  <tr key={item.studentId} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">
                          <Users className="w-4 h-4 text-faint" />
                        </div>
                        <span className="text-sm font-medium">
                          {allUsers.find(u => u.id === item.studentId)?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-sm text-muted">
                        <Building className="w-3 h-3 opacity-40" />
                        <span>{allDepartments.find(d => d.id === item.departmentId)?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold font-mono">
                        {item.totalHours.toFixed(2)}h
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-faint font-mono">
                        {formatCurrency(item.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-amber-600 font-mono">
                        {formatCurrency(tithe)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-emerald-600 font-mono">
                        {formatCurrency(item.totalAmount - tithe)}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm text-faint italic">
                    No hay pagos aprobados para procesar en este periodo.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {approvedForPayroll.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex justify-end"
          >
            <button
              onClick={onProcessPayments}
              className="px-8 py-4 bg-primary text-primary-fg rounded-2xl font-bold hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 flex items-center space-x-3 active:scale-95"
            >
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              <span>Procesar Pagos del Periodo</span>
              <ArrowRight className="w-4 h-4 opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountingPayrollTable;
