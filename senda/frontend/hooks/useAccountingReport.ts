/**
 * hooks/useAccountingReport.ts
 *
 * Replaces useAccountingData — fetches the pre-computed payroll report
 * from the backend instead of computing it locally.
 */

import { useState, useEffect, useRef } from 'react';
import {
  getPayrollReport,
  type PayrollReportParams,
  type AccountingReportData,
} from '../services/reportsService';
import { subscribeToTableChanges } from '../lib/realtime';

export type { AccountingReportData };

export function useAccountingReport(params: PayrollReportParams) {
  const [data,      setData]      = useState<AccountingReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // Stable ref so the realtime callback always sees the latest params
  // without re-mounting the subscription.
  const paramsRef = useRef(params);
  useEffect(() => { paramsRef.current = params; });

  const {
    viewMode, selectedCycle, selectedTrimester,
    selectedYear, searchTerm, selectedDeptId, currentRate, closingDay,
  } = params;

  // ── Fetch on filter change ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getPayrollReport(paramsRef.current)
      .then(result => { if (!cancelled) setData(result); })
      .catch(err   => { if (!cancelled) setError(err?.message ?? 'Error al cargar reporte'); })
      .finally(()  => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [
    viewMode, selectedCycle, selectedTrimester,
    selectedYear, searchTerm, selectedDeptId, currentRate, closingDay,
  ]);

  // ── Real-time: silently refresh when work_logs changes ───────────────────
  useEffect(() => {
    let refreshTimer: number | null = null;

    const scheduleBackgroundRefresh = () => {
      if (refreshTimer !== null) return;
      refreshTimer = window.setTimeout(() => {
        refreshTimer = null;
        getPayrollReport(paramsRef.current)
          .then(result => setData(result))
          .catch(err   => console.warn('[Realtime/reports] No se pudo refrescar reporte', err));
      }, 250);
    };

    const unsubscribeLogs = subscribeToTableChanges({
      table:    'work_logs',
      onChange: scheduleBackgroundRefresh,
    });

    const unsubscribeReceivables = subscribeToTableChanges({
      table:    'student_receivables',
      onChange: scheduleBackgroundRefresh,
    });

    return () => {
      unsubscribeLogs();
      unsubscribeReceivables();
      if (refreshTimer !== null) window.clearTimeout(refreshTimer);
    };
  }, []); // mount once — paramsRef always current

  return { data, isLoading, error };
}
