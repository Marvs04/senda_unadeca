/**
 * screens/accounting/AccountingCharts.tsx
 *
 * Monochromatic chart section for the Accounting portal.
 * Charts: dept bruto bar, top-5 students bar, weekly summary, quarterly cards.
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, CalendarDays, TrendingUp } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import type { TrimesterSummaryItem } from '../../hooks/useAccountingData';

interface AccountingChartsProps {
  chartData: { name: string; monto: number; neto: number }[];
  deptChartData: { name: string; bruto: number; neto: number; hours: number }[];
  weeklySummary: { key: string; hours: number; amount: number }[];
  trimesterSummary: TrimesterSummaryItem[];
  selectedTrimester: number;
  selectedYear: number;
  currentRate: number;
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const MonoTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-bold text-foreground mb-2 truncate max-w-[180px]">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex justify-between gap-6">
          <span className="text-muted capitalize">
            {p.name === 'bruto' ? 'Bruto' : p.name === 'neto' ? 'Neto' : p.name === 'monto' ? 'Bruto' : p.name}
          </span>
          <span className="font-mono font-bold text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Component ─────────────────────────────────────────────────────────────────
const AccountingCharts: React.FC<AccountingChartsProps> = ({
  chartData,
  deptChartData,
  weeklySummary,
  trimesterSummary,
  selectedTrimester,
  selectedYear,
}) => {
  const trimesterLabel = (n: number) =>
    n === 1 ? 'I Cuatri' : n === 2 ? 'II Cuatri' : 'III Cuatri';

  return (
    <>
      {/* ── Row 1: Dept Totals + Top 5 ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Dept bruto horizontal bar */}
        <div className="lg:col-span-7 bg-card p-6 rounded-[2rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-surface rounded-xl">
              <BarChart3 className="w-4 h-4 text-muted" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                Facturado por Departamento
              </h3>
              <p className="text-[10px] text-faint mt-0.5">Monto bruto aprobado en el período</p>
            </div>
          </div>
          {deptChartData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptChartData}
                  layout="vertical"
                  margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#a1a1aa' }}
                    tickFormatter={v => `₡${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#52525b' }}
                    width={90}
                  />
                  <Tooltip content={<MonoTooltip />} cursor={{ fill: '#f4f4f5' }} />
                  <Bar dataKey="bruto" name="bruto" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {deptChartData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={i === 0 ? '#18181b' : i % 2 === 0 ? '#52525b' : '#a1a1aa'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-xs text-faint italic">Sin datos aprobados en este período</p>
            </div>
          )}
        </div>

        {/* Top-5 students */}
        <div className="lg:col-span-5 bg-card p-6 rounded-[2rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-surface rounded-xl">
              <TrendingUp className="w-4 h-4 text-muted" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                Top 5 Estudiantes
              </h3>
              <p className="text-[10px] text-faint mt-0.5">Por monto bruto en el período</p>
            </div>
          </div>
          {chartData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#52525b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#a1a1aa' }}
                    tickFormatter={v => `₡${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<MonoTooltip />} cursor={{ fill: '#f4f4f5' }} />
                  <Bar dataKey="monto" name="monto" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {chartData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={i === 0 ? '#18181b' : '#d4d4d8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-xs text-faint italic">Sin datos aprobados</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Weekly Activity + Quarterly Cards ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Weekly activity */}
        <div className="lg:col-span-4 bg-card p-6 rounded-[2rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-surface rounded-xl">
              <CalendarDays className="w-4 h-4 text-muted" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                Actividad Semanal
              </h3>
              <p className="text-[10px] text-faint mt-0.5">Horas y monto por semana</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {weeklySummary.length > 0 ? (
              weeklySummary.map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl"
                >
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-faint">
                      {item.key}
                    </p>
                    <p className="text-sm font-bold">{item.hours.toFixed(1)} h</p>
                  </div>
                  <p className="text-xs font-black font-mono">{formatCurrency(item.amount)}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-faint italic text-center py-8">
                Sin datos en este período
              </p>
            )}
          </div>
        </div>

        {/* Quarterly breakdown */}
        <div className="lg:col-span-8 bg-card p-6 rounded-[2rem] border border-border-faint shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-surface rounded-xl">
              <CalendarDays className="w-4 h-4 text-muted" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                Resumen Anual — {selectedYear}
              </h3>
              <p className="text-[10px] text-faint mt-0.5">
                Todos los registros del año por cuatrimestre
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {trimesterSummary.map(t => {
              const active = t.trimester === selectedTrimester;
              return (
                <div
                  key={t.trimester}
                  className={cn(
                    'p-5 rounded-2xl border transition-all',
                    active
                      ? 'bg-foreground text-background border-transparent'
                      : 'bg-surface border-border-faint',
                  )}
                >
                  <p className={cn(
                    'text-[9px] font-black uppercase tracking-widest mb-3',
                    active ? 'text-background/50' : 'text-faint',
                  )}>
                    {trimesterLabel(t.trimester)}
                  </p>
                  <p className={cn('text-2xl font-black mb-2', active ? 'text-background' : 'text-foreground')}>
                    {t.hours.toFixed(0)} h
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className={active ? 'text-background/60' : 'text-faint'}>Bruto</span>
                      <span className={cn('font-mono font-bold', active ? 'text-background' : 'text-foreground')}>
                        {formatCurrency(t.bruto)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className={active ? 'text-background/60' : 'text-faint'}>Diezmo</span>
                      <span className={cn('font-mono', active ? 'text-background/70' : 'text-muted')}>
                        −{formatCurrency(t.tithe)}
                      </span>
                    </div>
                    <div className={cn(
                      'flex justify-between text-[10px] pt-1 border-t',
                      active ? 'border-background/20' : 'border-border-faint',
                    )}>
                      <span className={cn('font-bold', active ? 'text-background/70' : 'text-muted')}>
                        Neto
                      </span>
                      <span className={cn('font-mono font-bold', active ? 'text-background' : 'text-foreground')}>
                        {formatCurrency(t.neto)}
                      </span>
                    </div>
                  </div>
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
