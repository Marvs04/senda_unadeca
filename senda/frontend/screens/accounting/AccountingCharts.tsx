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

// Palette for Top-5 students (5 distinct hues)
const TOP5_COLORS = ['#1d3261', '#2563eb', '#0891b2', '#7c3aed', '#b45309'];
import { cn, formatCurrency } from '../../lib/utils';
import type { TrimesterSummaryItem } from '../../services/reportsService';

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
                    tick={{ fontSize: 9, fill: '#7a8aa8' }}
                    tickFormatter={v => `₡${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: '#3a5a99' }}
                    width={90}
                  />
                  <Tooltip content={<MonoTooltip />} cursor={{ fill: '#f4f4f5' }} />
                  <Bar dataKey="bruto" name="bruto" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {deptChartData.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={i === 0 ? '#1d3261' : i % 2 === 0 ? '#3a5a99' : '#7a8aa8'}
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
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#3a5a99' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#7a8aa8' }}
                    tickFormatter={v => `₡${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<MonoTooltip />} cursor={{ fill: '#f4f4f5' }} />
                  <Bar dataKey="monto" name="monto" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {chartData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={TOP5_COLORS[i % TOP5_COLORS.length]} />
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
          {weeklySummary.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklySummary} margin={{ left: -16, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis
                    dataKey="key"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#7a8aa8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#7a8aa8' }}
                    tickFormatter={v => `${v}h`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload as (typeof weeklySummary)[0];
                      return (
                        <div className="bg-card border border-border rounded-xl shadow-lg px-3 py-2 text-xs">
                          <p className="font-bold text-foreground mb-1">{label}</p>
                          <p className="text-muted">{d.hours.toFixed(1)} h &nbsp;·&nbsp; {formatCurrency(d.amount)}</p>
                        </div>
                      );
                    }}
                    cursor={{ fill: '#f4f4f5' }}
                  />
                  <Bar dataKey="hours" name="Horas" radius={[4, 4, 0, 0]} maxBarSize={28}>
                    {weeklySummary.map((_, i) => (
                      <Cell key={`w-${i}`} fill={i % 2 === 0 ? '#1d3261' : '#3a5a99'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-xs text-faint italic">Sin datos en este período</p>
            </div>
          )}
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
                      ? 'bg-card border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-surface border-border-faint',
                  )}
                >
                  <p className={cn(
                    'text-[9px] font-black uppercase tracking-widest mb-3',
                    active ? 'text-primary' : 'text-faint',
                  )}>
                    {trimesterLabel(t.trimester)}
                    {active && <span className="ml-1.5 normal-case">&#x2022; actual</span>}
                  </p>
                  <p className={cn('text-2xl font-black mb-2 text-foreground')}>
                    {t.hours.toFixed(0)} h
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-faint">Bruto</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(t.bruto)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-faint">Diezmo</span>
                      <span className="font-mono text-muted">
                        −{formatCurrency(t.tithe)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] pt-1 border-t border-border-faint">
                      <span className="font-bold text-muted">Neto</span>
                      <span className="font-mono font-bold text-foreground">
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
