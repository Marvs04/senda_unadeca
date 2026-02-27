import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
  TrendingUp,
} from 'lucide-react';
import { WorkLog } from '../../types';
import { cn, formatCurrency } from '../../lib/utils';
import { isDateInTrimester } from '../../lib/business';

interface AccountingChartsProps {
  chartData: { name: string; monto: number }[];
  deptData: { name: string; value: number }[];
  weeklySummary: { key: string; hours: number; amount: number }[];
  selectedTrimester: number;
  selectedYear: number;
  allLogs: WorkLog[];
  currentRate: number;
}

const AccountingCharts: React.FC<AccountingChartsProps> = ({
  chartData,
  deptData,
  weeklySummary,
  selectedTrimester,
  selectedYear,
  allLogs,
  currentRate,
}) => {
  return (
    <>
      {/* Bar + Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-zinc-100 rounded-xl">
              <BarChart3 className="w-4 h-4 text-zinc-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Mayores Pagos (Top 5)
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                  tickFormatter={val => `₡${val / 1000}k`}
                />
                <Tooltip
                  cursor={{ fill: '#f4f4f5' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(val: number) => [formatCurrency(val), 'Monto']}
                />
                <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#18181b' : '#e4e4e7'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <div className="p-2 bg-zinc-100 rounded-xl">
              <PieChartIcon className="w-4 h-4 text-zinc-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Horas por Depto.
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deptData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={['#18181b', '#6366f1', '#10b981', '#f59e0b', '#ef4444'][index % 5]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Summary + Trimester Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-4 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-zinc-100 rounded-xl">
              <CalendarDays className="w-4 h-4 text-zinc-600" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Resumen Semanal
            </h3>
          </div>
          <div className="space-y-4">
            {weeklySummary.map(item => (
              <div
                key={item.key}
                className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    {item.key}
                  </p>
                  <p className="text-sm font-bold">{item.hours.toFixed(1)} horas</p>
                </div>
                <p className="text-sm font-black text-zinc-900">{formatCurrency(item.amount)}</p>
              </div>
            ))}
            {weeklySummary.length === 0 && (
              <p className="text-xs text-zinc-400 italic text-center py-8">
                Sin datos para este periodo
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-zinc-100 rounded-xl">
                <TrendingUp className="w-4 h-4 text-zinc-600" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                Progreso del Cuatrimestre
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[1, 2, 3].map(tNum => {
              const tLogs = (allLogs || []).filter(l =>
                isDateInTrimester(l.date, tNum, selectedYear),
              );
              const tHours = tLogs.reduce((acc, l) => acc + l.hours, 0);
              const tAmount = tHours * currentRate;
              const isCurrent = tNum === selectedTrimester;

              return (
                <div
                  key={tNum}
                  className={cn(
                    'p-6 rounded-3xl border transition-all',
                    isCurrent
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl shadow-zinc-900/20'
                      : 'bg-white border-zinc-100 text-zinc-900',
                  )}
                >
                  <p
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest mb-4',
                      'text-zinc-400',
                    )}
                  >
                    Cuatri {tNum}
                  </p>
                  <p className="text-2xl font-black mb-1">{tHours.toFixed(0)}h</p>
                  <p className={cn('text-xs font-bold', isCurrent ? 'text-emerald-400' : 'text-zinc-500')}>
                    {formatCurrency(tAmount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountingCharts;
